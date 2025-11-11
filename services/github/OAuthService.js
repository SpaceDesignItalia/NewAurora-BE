// services/github/OAuthService.js
const axios = require("axios");
const crypto = require("crypto");
const PATEncryption = require("../crypto/encryptPAT");

/**
 * Service per gestire OAuth GitHub flow
 * Supporta sia OAuth che PAT manuale
 * NOTA: Non loggare mai token o secrets
 */

class GitHubOAuthService {
  /**
   * Genera URL per OAuth GitHub login
   * @param {string} state - State token per CSRF protection
   * @param {string} redirectUri - URI di redirect dopo autenticazione
   * @returns {string} - URL OAuth GitHub
   */
  static getOAuthUrl(state, redirectUri = null) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "GITHUB_CLIENT_ID non configurato nelle variabili d'ambiente. " +
          "Se vuoi usare OAuth, configura GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nel file .env. " +
          "Altrimenti, puoi usare un Personal Access Token (PAT) con l'endpoint /github/auth/validate-token"
      );
    }

    const defaultRedirectUri =
      redirectUri ||
      process.env.GITHUB_OAUTH_REDIRECT_URI ||
      "http://localhost:5173/auth/github/callback";

    const scopes = ["repo", "workflow", "read:user"];
    const scopeString = scopes.join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: defaultRedirectUri,
      scope: scopeString,
      state: state,
      response_type: "code",
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Scambia il codice OAuth con un access token
   * @param {string} code - Codice OAuth ricevuto dal callback
   * @param {string} state - State token per validazione CSRF
   * @returns {Promise<{access_token: string, token_type: string, scope: string}>}
   */
  static async exchangeCodeForToken(code, state, redirectUri = null) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Credenziali OAuth GitHub non configurate");
    }

    // Usa lo stesso redirect_uri usato per generare l'URL OAuth
    const defaultRedirectUri =
      redirectUri ||
      process.env.GITHUB_OAUTH_REDIRECT_URI ||
      "http://localhost:5173/auth/github/callback";

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          state: state,
          redirect_uri: defaultRedirectUri, // IMPORTANTE: deve corrispondere a quello usato nell'URL OAuth
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.data.error) {
        throw new Error(
          `OAuth error: ${
            response.data.error_description || response.data.error
          }`
        );
      }

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type || "bearer",
        scope: response.data.scope,
      };
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Errore OAuth: ${
            error.response.data?.error_description || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Valida un token GitHub (OAuth o PAT)
   * @param {string} token - Token da validare
   * @returns {Promise<{valid: boolean, user?: object, scopes?: string[]}>}
   */
  static async validateToken(token) {
    if (!token || typeof token !== "string") {
      return { valid: false, reason: "Token non fornito" };
    }

    try {
      // Verifica token chiamando GitHub API
      const userResponse = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      // Verifica permessi chiamando l'endpoint di rate limit (include scopes)
      const rateLimitResponse = await axios.get(
        "https://api.github.com/rate_limit",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      // Estrai scopes dall'header (se disponibile)
      const scopes = rateLimitResponse.headers["x-oauth-scopes"]
        ? rateLimitResponse.headers["x-oauth-scopes"].split(", ")
        : [];

      return {
        valid: true,
        user: {
          id: userResponse.data.id,
          login: userResponse.data.login,
          name: userResponse.data.name,
          email: userResponse.data.email,
          avatar_url: userResponse.data.avatar_url,
        },
        scopes: scopes,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        return { valid: false, reason: "Token non valido o scaduto" };
      }
      return { valid: false, reason: "Errore nella validazione del token" };
    }
  }

  /**
   * Verifica che un token abbia i permessi necessari per repo/actions
   * @param {string} token - Token da verificare
   * @returns {Promise<{hasPermissions: boolean, missingScopes?: string[]}>}
   */
  static async checkRepoPermissions(token) {
    const requiredScopes = ["repo"];
    const optionalScopes = ["workflow"];

    try {
      const validation = await this.validateToken(token);
      if (!validation.valid) {
        return {
          hasPermissions: false,
          missingScopes: requiredScopes,
          reason: validation.reason,
        };
      }

      const userScopes = validation.scopes || [];
      const missingScopes = requiredScopes.filter(
        (scope) => !userScopes.includes(scope)
      );

      return {
        hasPermissions: missingScopes.length === 0,
        missingScopes: missingScopes,
        scopes: userScopes,
      };
    } catch (error) {
      return {
        hasPermissions: false,
        missingScopes: requiredScopes,
        reason: "Errore nella verifica dei permessi",
      };
    }
  }

  /**
   * Cripta e salva un token (per memorizzazione sicura)
   * @param {string} token - Token in chiaro
   * @returns {string} - Token crittografato
   */
  static encryptToken(token) {
    return PATEncryption.encrypt(token);
  }

  /**
   * Decripta un token (per utilizzo)
   * @param {string} encryptedToken - Token crittografato
   * @returns {string} - Token in chiaro
   */
  static decryptToken(encryptedToken) {
    return PATEncryption.decrypt(encryptedToken);
  }

  /**
   * Genera uno state token per CSRF protection
   * @returns {string} - State token
   */
  static generateStateToken() {
    return crypto.randomBytes(32).toString("hex");
  }
}

module.exports = GitHubOAuthService;
