// controllers/GitHubController.js
const axios = require("axios");
const GitHubSecretEncryption = require("../services/github/encryptSecret");
const GitHubOAuthService = require("../services/github/OAuthService");
const TokenValidator = require("../services/github/TokenValidator");
const SafeLogger = require("../services/github/SafeLogger");

/**
 * Controller per gestire le operazioni GitHub Actions
 * IMPORTANTE: Non loggare mai token o segreti
 */

class GitHubController {
  /**
   * Inizia OAuth flow GitHub
   * GET /github/auth/oauth
   * Query params: redirectUri (opzionale)
   */
  static async startOAuth(req, res) {
    try {
      const { redirectUri } = req.query;
      const state = GitHubOAuthService.generateStateToken();

      // Salva state in sessione per validazione CSRF
      req.session.githubOAuthState = state;

      const oauthUrl = GitHubOAuthService.getOAuthUrl(state, redirectUri);

      // Salva redirect_uri in sessione per usarlo nel callback
      const finalRedirectUri =
        redirectUri ||
        process.env.GITHUB_OAUTH_REDIRECT_URI ||
        "http://localhost:5173/auth/github/callback";
      req.session.githubOAuthRedirectUri = finalRedirectUri;

      SafeLogger.logOperation(
        "oauth_start",
        { redirectUri: finalRedirectUri },
        req.session?.account?.id
      );

      return res.status(200).json({
        url: oauthUrl, // Formato standard per frontend
        oauthUrl: oauthUrl, // Alias per compatibilità
        github_url: oauthUrl, // Alias alternativo
        state,
        message: "Reindirizza l'utente all'URL OAuth fornito",
      });
    } catch (error) {
      SafeLogger.logError("oauth_start", error, { query: req.query });

      // Se OAuth non è configurato, suggerisci di usare PAT
      if (
        error.message &&
        error.message.includes("GITHUB_CLIENT_ID non configurato")
      ) {
        return res.status(400).json({
          error: "OAuth non configurato",
          message: error.message,
          alternative:
            "Puoi usare un Personal Access Token (PAT) con l'endpoint POST /API/v1/github/auth/validate-token",
          instructions: {
            step1: "Vai su https://github.com/settings/tokens",
            step2: "Genera un nuovo token con scope 'repo' e 'workflow'",
            step3: "Usa POST /API/v1/github/auth/validate-token con il token",
          },
        });
      }

      return res.status(500).json({
        error: "Errore OAuth",
        message: error.message || "Impossibile avviare il flusso OAuth",
      });
    }
  }

  /**
   * Callback OAuth GitHub
   * GET /github/auth/callback
   * Query params: code, state
   */
  static async oAuthCallback(req, res) {
    try {
      const { code, state } = req.query;

      // Log per debug
      SafeLogger.logOperation("oauth_callback_start", {
        hasCode: !!code,
        hasState: !!state,
        codeLength: code?.length,
        stateLength: state?.length,
      });

      if (!code) {
        return res.status(400).json({
          error: "Codice mancante",
          message: "Il codice OAuth non è stato fornito",
        });
      }

      // Protezione contro chiamate duplicate: se il codice è già stato processato
      const processedCodeKey = `oauth_processed_${code}`;
      if (req.session[processedCodeKey]) {
        SafeLogger.logOperation("oauth_callback_duplicate", {
          code: code.substring(0, 10),
        });
        return res.status(400).json({
          error: "Codice già utilizzato",
          message:
            "Questo codice OAuth è già stato utilizzato. Riprova il login.",
          retry: true,
        });
      }

      // Marca il codice come in elaborazione
      req.session[processedCodeKey] = true;

      // Valida state CSRF
      // Nota: Se la sessione non è condivisa, lo state potrebbe non essere presente
      // In questo caso, accettiamo lo state se è fornito (il frontend lo valida già)
      if (!state) {
        return res.status(400).json({
          error: "State mancante",
          message: "Il parametro 'state' è obbligatorio per la sicurezza CSRF.",
        });
      }

      // Se lo state è nella sessione, validalo
      // Altrimenti, accettalo (il frontend ha già validato contro sessionStorage)
      // In sviluppo, se la sessione non è condivisa, accettiamo lo state se fornito
      const sessionState = req.session?.githubOAuthState;

      if (sessionState && state !== sessionState) {
        SafeLogger.logError("oauth_callback", new Error("State mismatch"), {
          sessionState: sessionState?.substring(0, 10),
          receivedState: state.substring(0, 10),
        });
        return res.status(400).json({
          error: "State non valido",
          message: "State token non corrisponde. Possibile attacco CSRF.",
        });
      }

      // Se non c'è state in sessione (sessioni non condivise), logga per debug
      if (!sessionState) {
        SafeLogger.logOperation("oauth_callback", {
          note: "State non trovato in sessione, accettato comunque (validato lato frontend)",
        });
      }

      // Scambia codice con token
      let tokenData;
      try {
        // Usa lo stesso redirect_uri salvato in sessione quando si è generato l'URL OAuth
        const redirectUri =
          req.session?.githubOAuthRedirectUri ||
          process.env.GITHUB_OAUTH_REDIRECT_URI ||
          "http://localhost:5173/auth/github/callback";

        SafeLogger.logOperation("oauth_exchange_code", {
          codeLength: code.length,
          stateLength: state.length,
          redirectUri: redirectUri,
        });

        tokenData = await GitHubOAuthService.exchangeCodeForToken(
          code,
          state,
          redirectUri
        );

        SafeLogger.logOperation("oauth_exchange_success", {
          hasToken: !!tokenData?.access_token,
        });
      } catch (error) {
        SafeLogger.logError("oauth_exchange_failed", error, {
          errorMessage: error.message,
          codeLength: code?.length,
        });

        // Gestisci errori specifici del codice OAuth
        if (
          error.message?.includes("incorrect or expired") ||
          error.message?.includes("bad_verification_code")
        ) {
          return res.status(400).json({
            error: "Codice OAuth scaduto o non valido",
            message:
              "Il codice di autorizzazione è scaduto o già utilizzato. I codici OAuth GitHub scadono dopo pochi minuti. Riprova il login.",
            retry: true,
            details: error.message,
          });
        }
        throw error; // Rilancia altri errori
      }

      // Valida token e permessi
      const validation = await TokenValidator.validateToken(
        tokenData.access_token,
        true
      );
      if (!validation.valid) {
        return res.status(401).json({
          error: "Token non valido",
          message: validation.error,
        });
      }

      // Cripta token per storage sicuro (opzionale)
      const encryptedToken = GitHubOAuthService.encryptToken(
        tokenData.access_token
      );

      // Salva in sessione (o database se necessario)
      req.session.githubToken = encryptedToken;
      req.session.githubUser = validation.user;

      SafeLogger.logOperation(
        "oauth_callback",
        { user: validation.user.login },
        req.session?.account?.id
      );

      // Pulisci state dalla sessione
      delete req.session.githubOAuthState;

      // Restituisci token al frontend (necessario per chiamate API successive)
      // In produzione, considera alternative più sicure (httpOnly cookies)
      return res.status(200).json({
        success: true,
        message: "Autenticazione GitHub completata con successo",
        user: validation.user,
        scopes: validation.scopes,
        token: tokenData.access_token, // Token per chiamate API frontend
      });
    } catch (error) {
      SafeLogger.logError("oauth_callback", error, { query: req.query });

      // Gestisci errori specifici
      if (error.message?.includes("incorrect or expired")) {
        return res.status(400).json({
          error: "Codice OAuth scaduto",
          message:
            "Il codice di autorizzazione è scaduto. I codici OAuth GitHub scadono dopo pochi minuti. Riprova il login.",
          retry: true,
        });
      }

      if (error.message?.includes("bad_verification_code")) {
        return res.status(400).json({
          error: "Codice OAuth non valido",
          message:
            "Il codice di autorizzazione non è valido. Potrebbe essere già stato utilizzato. Riprova il login.",
          retry: true,
        });
      }

      return res.status(500).json({
        error: "Errore OAuth callback",
        message:
          error.message || "Impossibile completare l'autenticazione OAuth",
        retry: true,
      });
    }
  }

  /**
   * Ottieni token dalla sessione (dopo OAuth login)
   * GET /github/auth/token
   * Restituisce il token salvato in sessione dopo OAuth
   */
  static async getToken(req, res) {
    try {
      const encryptedToken = req.session?.githubToken;
      const user = req.session?.githubUser;

      if (!encryptedToken || !user) {
        return res.status(401).json({
          error: "Non autenticato",
          message: "Fai login con GitHub prima. Token non trovato in sessione.",
        });
      }

      // Decripta token per restituirlo al frontend
      const token = GitHubOAuthService.decryptToken(encryptedToken);

      SafeLogger.logOperation(
        "get_token",
        { user: user.login },
        req.session?.account?.id
      );

      return res.status(200).json({
        token: token,
        user: user,
      });
    } catch (error) {
      SafeLogger.logError("get_token", error);
      return res.status(500).json({
        error: "Errore",
        message: "Impossibile recuperare il token dalla sessione",
      });
    }
  }

  /**
   * Verifica se l'utente è autenticato con GitHub
   * GET /github/auth/status
   * Restituisce lo stato di autenticazione GitHub
   */
  static async getAuthStatus(req, res) {
    try {
      const encryptedToken = req.session?.githubToken;
      const user = req.session?.githubUser;

      if (!encryptedToken || !user) {
        return res.status(200).json({
          authenticated: false,
          user: null,
        });
      }

      SafeLogger.logOperation(
        "check_auth_status",
        { user: user.login },
        req.session?.account?.id
      );

      return res.status(200).json({
        authenticated: true,
        user: user,
      });
    } catch (error) {
      SafeLogger.logError("check_auth_status", error);
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }
  }

  /**
   * Logout GitHub - Rimuove token e dati utente dalla sessione
   * POST /github/auth/logout
   */
  static async logout(req, res) {
    try {
      const user = req.session?.githubUser;

      SafeLogger.logOperation(
        "logout",
        { user: user?.login },
        req.session?.account?.id
      );

      // Rimuovi token e dati utente dalla sessione
      delete req.session.githubToken;
      delete req.session.githubUser;
      delete req.session.githubOAuthState;
      delete req.session.githubOAuthRedirectUri;

      // Salva la sessione per assicurarsi che le modifiche vengano applicate
      req.session.save((err) => {
        if (err) {
          SafeLogger.logError("logout_session_save", err);
        }
      });

      return res.status(200).json({
        success: true,
        message: "Logout completato con successo",
        authenticated: false,
      });
    } catch (error) {
      SafeLogger.logError("logout", error);
      return res.status(500).json({
        error: "Errore",
        message: "Impossibile completare il logout",
      });
    }
  }

  /**
   * Valida token PAT inserito manualmente
   * POST /github/auth/validate-token
   * Body: { token: string }
   */
  static async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: "Token mancante",
          message: "Il campo 'token' è obbligatorio",
        });
      }

      // Valida token e permessi
      const validation = await TokenValidator.validateToken(token, true);

      if (!validation.valid) {
        return res.status(401).json({
          valid: false,
          error: validation.error,
          missingScopes: validation.missingScopes,
        });
      }

      SafeLogger.logOperation(
        "validate_token",
        { user: validation.user.login },
        req.session?.account?.id
      );

      return res.status(200).json({
        valid: true,
        user: validation.user,
        scopes: validation.scopes,
        message: "Token valido con permessi corretti",
      });
    } catch (error) {
      SafeLogger.logError("validate_token", error);
      return res.status(500).json({
        error: "Errore validazione",
        message: "Impossibile validare il token",
      });
    }
  }

  /**
   * Lista tutti i repository accessibili
   * GET /github/repos
   * Header: Authorization: Bearer <token>
   */
  static async listRepos(req, res) {
    try {
      // Token già validato dal middleware
      const githubToken = req.githubToken || TokenValidator.extractToken(req);

      if (!githubToken) {
        return res.status(401).json({
          error: "Token mancante",
          message:
            "Fornire un token GitHub nell'header Authorization: Bearer <token>",
        });
      }

      // Chiama l'API GitHub per ottenere i repository
      const response = await axios.get("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        params: {
          per_page: 100,
          sort: "updated",
          direction: "desc",
        },
      });

      // Mappa i repository
      const repos = response.data.map((repo) => ({
        full_name: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        url: repo.html_url,
      }));

      SafeLogger.logSuccess("list_repos", {
        count: repos.length,
        user: req.githubUser?.login,
      });

      return res.status(200).json(repos);
    } catch (error) {
      SafeLogger.logError("list_repos", error, { user: req.githubUser?.login });

      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          return res.status(401).json({
            error: "Token non autorizzato",
            message: "Il token fornito non è valido o è scaduto.",
          });
        }

        if (status === 403) {
          return res.status(403).json({
            error: "Permessi insufficienti",
            message:
              "Il token non ha i permessi necessari. Assicurati che il token abbia lo scope 'repo'.",
          });
        }

        return res.status(status).json({
          error: "Errore GitHub API",
          message: error.response.data?.message || "Errore nella chiamata API",
        });
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return res.status(504).json({
          error: "Timeout",
          message: "La richiesta a GitHub ha impiegato troppo tempo.",
        });
      }

      return res.status(500).json({
        error: "Errore interno",
        message: "Impossibile recuperare la lista dei repository.",
      });
    }
  }

  /**
   * Lista i secrets esistenti in un repository (formato owner/repo come unico parametro)
   * GET /github/repos/:repoFullName/secrets
   * Header: Authorization: Bearer <token>
   */
  static async listSecretsFromFullName(req, res) {
    try {
      const { repoFullName } = req.params;
      const githubToken = req.githubToken || TokenValidator.extractToken(req);

      if (!githubToken) {
        return res.status(401).json({
          error: "Token mancante",
          message: "Fornire un token GitHub",
        });
      }

      // Parsa owner/repo dal repoFullName
      const parts = repoFullName.split("/");
      if (parts.length !== 2) {
        return res.status(400).json({
          error: "Formato repository non valido",
          message: "Il repository deve essere nel formato 'owner/repo'",
        });
      }

      const [owner, repo] = parts;

      SafeLogger.logOperation(
        "list_secrets",
        { repo: repoFullName },
        req.session?.account?.id
      );

      // GET https://api.github.com/repos/{owner}/{repo}/actions/secrets
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/secrets`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      // GitHub restituisce { total_count: number, secrets: Array }
      const secrets = response.data?.secrets || [];

      SafeLogger.logSuccess("list_secrets", {
        repo: repoFullName,
        count: secrets.length,
      });

      return res.status(200).json(secrets);
    } catch (error) {
      SafeLogger.logError("list_secrets", error, {
        repo: req.params.repoFullName,
      });

      if (error.response?.status === 404) {
        return res.status(404).json({
          error: "Repository non trovato",
          message: `Il repository non esiste o non hai accesso ad esso.`,
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Permessi insufficienti",
          message: "Token mancante dei permessi 'repo' o 'actions:read'",
        });
      }

      return res.status(500).json({
        error: "Errore interno",
        message: "Impossibile recuperare la lista dei secrets.",
      });
    }
  }

  /**
   * Lista i secrets esistenti in un repository
   * GET /github/repos/:owner/:repo/secrets
   * Header: Authorization: Bearer <token>
   * Gestisce anche il caso in cui owner/repo viene passato come unico parametro
   */
  static async listSecrets(req, res) {
    try {
      let { owner, repo } = req.params;
      const githubToken = req.githubToken || TokenValidator.extractToken(req);

      if (!githubToken) {
        return res.status(401).json({
          error: "Token mancante",
          message: "Fornire un token GitHub",
        });
      }

      // Se repo non è definito, significa che owner contiene "owner/repo"
      if (!repo && owner && owner.includes("/")) {
        const parts = owner.split("/");
        if (parts.length === 2) {
          owner = parts[0];
          repo = parts[1];
        } else {
          return res.status(400).json({
            error: "Formato repository non valido",
            message: "Il repository deve essere nel formato 'owner/repo'",
          });
        }
      }

      if (!owner || !repo) {
        return res.status(400).json({
          error: "Parametri mancanti",
          message:
            "Fornire sia owner che repo, oppure owner/repo come unico parametro",
        });
      }

      const repoFullName = `${owner}/${repo}`;

      SafeLogger.logOperation(
        "list_secrets",
        { repo: repoFullName },
        req.session?.account?.id
      );

      // GET https://api.github.com/repos/{owner}/{repo}/actions/secrets
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/secrets`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      // GitHub restituisce { total_count: number, secrets: Array }
      const secrets = response.data?.secrets || [];

      SafeLogger.logSuccess("list_secrets", {
        repo: repoFullName,
        count: secrets.length,
      });

      return res.status(200).json(secrets);
    } catch (error) {
      SafeLogger.logError("list_secrets", error, {
        repo: `${req.params.owner}/${req.params.repo}`,
      });

      if (error.response?.status === 404) {
        return res.status(404).json({
          error: "Repository non trovato",
          message: `Il repository non esiste o non hai accesso ad esso.`,
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Permessi insufficienti",
          message: "Token mancante dei permessi 'repo' o 'actions:read'",
        });
      }

      return res.status(500).json({
        error: "Errore interno",
        message: "Impossibile recuperare la lista dei secrets.",
      });
    }
  }

  /**
   * Pubblica un singolo secret su un repository
   * POST /github/repos/:owner/:repo/secrets
   * Body: { secretName: string, secretValue: string }
   * Header: Authorization: Bearer <token>
   */
  static async pushSecret(req, res) {
    try {
      const { owner, repo } = req.params;
      const { secretName, secretValue } = req.body;
      const githubToken = req.githubToken || TokenValidator.extractToken(req);

      if (!githubToken) {
        return res.status(401).json({
          error: "Token mancante",
          message: "Fornire un token GitHub",
        });
      }

      if (!secretName || typeof secretName !== "string") {
        return res.status(400).json({
          error: "Nome secret mancante",
          message: "Il campo 'secretName' è obbligatorio",
        });
      }

      if (!secretValue || typeof secretValue !== "string") {
        return res.status(400).json({
          error: "Valore secret mancante",
          message: "Il campo 'secretValue' è obbligatorio",
        });
      }

      // Valida formato nome secret
      if (!/^[A-Z_][A-Z0-9_]*$/.test(secretName)) {
        return res.status(400).json({
          error: "Nome secret non valido",
          message:
            "Il nome del secret deve iniziare con una lettera o underscore e contenere solo lettere maiuscole, numeri e underscore",
        });
      }

      const repoFullName = `${owner}/${repo}`;

      // Verifica se secret esiste già
      let existingSecret = false;
      try {
        await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
            },
          }
        );
        existingSecret = true;
      } catch (error) {
        // 404 è OK, significa che il secret non esiste
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      // Step 1: Ottieni chiave pubblica
      const publicKeyResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      const publicKeyData = publicKeyResponse.data;

      // Step 2: Cripta secret
      const encryptedValue = await GitHubSecretEncryption.encryptSecret(
        secretValue,
        publicKeyData.key
      );

      // Step 3: Pubblica secret
      await axios.put(
        `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
        {
          encrypted_value: encryptedValue,
          key_id: publicKeyData.key_id,
        },
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      SafeLogger.logSuccess("push_secret", {
        repo: repoFullName,
        secretName,
        overwritten: existingSecret,
      });

      return res.status(200).json({
        ok: true,
        message: `Secret '${secretName}' pubblicato con successo su '${repoFullName}'`,
        overwritten: existingSecret,
        warning: existingSecret
          ? "Il secret esistente è stato sovrascritto"
          : undefined,
      });
    } catch (error) {
      SafeLogger.logError("push_secret", error, {
        repo: req.params ? `${req.params.owner}/${req.params.repo}` : null,
      });

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Permessi insufficienti",
          message: "Token mancante dei permessi repo/actions.",
        });
      }

      if (error.response?.status === 404) {
        return res.status(404).json({
          error: "Repository non trovato",
          message: `Il repository non esiste o non hai accesso ad esso.`,
        });
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return res.status(504).json({
          error: "Timeout",
          message: "La richiesta a GitHub ha impiegato troppo tempo.",
        });
      }

      return res.status(500).json({
        error: "Errore interno",
        message: "Impossibile pubblicare il secret su GitHub Actions.",
      });
    }
  }

  /**
   * Pubblica multipli secrets su un repository
   * POST /github/repos/:owner/:repo/secrets/bulk
   * Body: { secrets: [{ name: string, value: string }] }
   * Header: Authorization: Bearer <token>
   */
  static async pushSecretsBulk(req, res) {
    try {
      const { owner, repo } = req.params;
      const { secrets } = req.body;
      const githubToken = req.githubToken || TokenValidator.extractToken(req);

      if (!githubToken) {
        return res.status(401).json({
          error: "Token mancante",
          message: "Fornire un token GitHub",
        });
      }

      if (!secrets || !Array.isArray(secrets) || secrets.length === 0) {
        return res.status(400).json({
          error: "Secrets mancanti",
          message: "Il campo 'secrets' deve essere un array non vuoto",
        });
      }

      // Valida ogni secret
      for (const secret of secrets) {
        if (!secret.name || typeof secret.name !== "string") {
          return res.status(400).json({
            error: "Nome secret mancante",
            message: "Ogni secret deve avere un campo 'name'",
          });
        }

        if (!secret.value || typeof secret.value !== "string") {
          return res.status(400).json({
            error: "Valore secret mancante",
            message: `Il secret '${secret.name}' deve avere un campo 'value'`,
          });
        }

        if (!/^[A-Z_][A-Z0-9_]*$/.test(secret.name)) {
          return res.status(400).json({
            error: "Nome secret non valido",
            message: `Il nome '${secret.name}' non è valido. Usa solo MAIUSCOLE, numeri e underscore.`,
          });
        }
      }

      const repoFullName = `${owner}/${repo}`;

      // Step 1: Ottieni chiave pubblica (una volta per tutti i secrets)
      const publicKeyResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      const publicKeyData = publicKeyResponse.data;

      // Step 2: Processa ogni secret
      const results = [];
      const errors = [];

      for (const secret of secrets) {
        try {
          // Verifica se esiste già
          let existingSecret = false;
          try {
            await axios.get(
              `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secret.name}`,
              {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                  Accept: "application/vnd.github+json",
                },
              }
            );
            existingSecret = true;
          } catch (error) {
            if (error.response?.status !== 404) {
              throw error;
            }
          }

          // Cripta
          const encryptedValue = await GitHubSecretEncryption.encryptSecret(
            secret.value,
            publicKeyData.key
          );

          // Pubblica
          await axios.put(
            `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secret.name}`,
            {
              encrypted_value: encryptedValue,
              key_id: publicKeyData.key_id,
            },
            {
              headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );

          results.push({
            name: secret.name,
            success: true,
            overwritten: existingSecret,
          });
        } catch (error) {
          errors.push({
            name: secret.name,
            error: error.response?.data?.message || error.message,
          });
        }
      }

      const overwrittenCount = results.filter((r) => r.overwritten).length;

      SafeLogger.logSuccess("push_secrets_bulk", {
        repo: repoFullName,
        total: secrets.length,
        success: results.length,
        errors: errors.length,
        overwritten: overwrittenCount,
      });

      return res.status(200).json({
        ok: true,
        message: `Pubblicati ${results.length} su ${secrets.length} secrets`,
        results,
        errors: errors.length > 0 ? errors : undefined,
        warnings:
          overwrittenCount > 0
            ? `${overwrittenCount} secret(s) esistente(i) sono stati sovrascritti`
            : undefined,
      });
    } catch (error) {
      SafeLogger.logError("push_secrets_bulk", error, {
        repo: req.params ? `${req.params.owner}/${req.params.repo}` : null,
      });

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Permessi insufficienti",
          message: "Token mancante dei permessi repo/actions.",
        });
      }

      if (error.response?.status === 404) {
        return res.status(404).json({
          error: "Repository non trovato",
          message: `Il repository non esiste o non hai accesso ad esso.`,
        });
      }

      return res.status(500).json({
        error: "Errore interno",
        message: "Impossibile pubblicare i secrets su GitHub Actions.",
      });
    }
  }

  /**
   * Metodo legacy per compatibilità
   * POST /api/github/push-secret
   */
  static async pushSecretLegacy(req, res) {
    // Adatta il formato legacy al nuovo formato
    const { githubToken, repoFullName, secretName, secretValue } = req.body;

    if (!repoFullName) {
      return res.status(400).json({
        error: "Repository mancante",
        message: "Il campo 'repoFullName' è obbligatorio",
      });
    }

    const match = repoFullName.match(/^([^\/]+)\/([^\/]+)$/);
    if (!match) {
      return res.status(400).json({
        error: "Formato repository non valido",
        message: "Il repository deve essere nel formato 'owner/repo'",
      });
    }

    // Imposta params e body per il nuovo formato
    req.params = { owner: match[1], repo: match[2] };
    req.body = { secretName, secretValue };

    if (githubToken) {
      req.headers.authorization = `Bearer ${githubToken}`;
    }

    // Chiama il metodo nuovo
    return this.pushSecret(req, res);
  }

  /**
   * Metodo legacy per compatibilità
   * GET /api/github/list-repos
   */
  static async listReposLegacy(req, res) {
    return this.listRepos(req, res);
  }
}

module.exports = GitHubController;
