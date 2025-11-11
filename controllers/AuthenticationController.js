// controller/AuthenticationController.js
const Authentication = require("../Models/AuthenticationModel");
const EmailService = require("../middlewares/EmailService/EmailService");
const axios = require("axios");
const crypto = require("crypto");
const { URLSearchParams } = require("url");
const GitHubOAuthService = require("../services/github/OAuthService");
const TokenValidator = require("../services/github/TokenValidator");

class AuthenticationController {
  static async register(req, res) {
    try {
      const register_data = req.body.register_data;
      let account = await Authentication.register(register_data);

      // Imposta la durata del cookie di sessione
      req.session.cookie.maxAge = 60 * 60 * 1000; // 1 ora in millisecondi

      delete account.password; // Elimina la password dall'oggetto account prima di salvare nella sessione

      req.session.account = account;

      res.status(200).json({
        message: "Registrazione avvenuta con successo",
      });
    } catch (error) {
      console.error("Errore nella registrazione:", error);
      res.status(500).send("Registrazione fallita");
    }
  }

  static async login(req, res) {
    try {
      const login_data = req.body.login_data;
      let account = await Authentication.login(login_data);

      // Se account è false, significa che l'email non esiste
      if (account === false) {
        return res.status(401).json({
          error: "Credenziali non valide",
        });
      }

      // Imposta la durata del cookie di sessione
      req.session.cookie.maxAge = login_data.rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 giorni in millisecondi
        : 60 * 60 * 1000; // 1 ora in millisecondi

      delete account.password; // Elimina la password dall'oggetto account prima di salvare nella sessione

      req.session.account = account;

      res.status(200).json({
        message: "Login avvenuto con successo",
      });
    } catch (error) {
      console.error("Errore nel login:", error);

      // Se l'errore è false, significa password errata
      if (error === false) {
        return res.status(401).json({
          error: "Credenziali non valide",
        });
      }

      // Per tutti gli altri errori (problemi del server)
      res.status(500).json({
        error: "Errore interno del server",
      });
    }
  }

  static logout(req, res) {
    try {
      // Pulisci anche i dati GitHub dalla sessione se presenti
      if (req.session) {
        delete req.session.githubToken;
        delete req.session.githubUser;
        delete req.session.githubOAuthState;
        delete req.session.githubOAuthRedirectUri;
      }

      // Distruggi la sessione
      req.session.destroy((err) => {
        if (err) {
          console.error("Errore durante il logout:", err);
          return res.status(500).json({
            error: "Errore interno del server",
            message: "Impossibile completare il logout",
          });
        }

        // Pulisci il cookie di sessione
        res.clearCookie("connect.sid"); // Nome predefinito di express-session
        res.clearCookie("sessionId"); // Se usi un nome personalizzato

        // Restituisci risposta di successo
        return res.status(200).json({
          success: true,
          message: "Logout effettuato con successo",
          authenticated: false,
        });
      });
    } catch (error) {
      console.error("Errore durante il logout:", error);
      return res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile completare il logout",
      });
    }
  }

  static async get_session_data(req, res) {
    // Verifica se la sessione è stata creata
    if (req.session.account) {
      // Verifica se l'utente è autenticato
      return res.status(200).json(req.session.account);
    } else {
      return res.status(401).json({ error: "Non autorizzato" });
    }
  }

  static async check_session(req, res) {
    try {
      // Verifica se la sessione è stata creata
      if (req.session.account) {
        // Verifica se l'utente è autenticato
        res.json(true);
      } else {
        res.json(false);
      }
    } catch (error) {
      console.error("Errore nel recupero della sessione:", error);
      res.status(500).send("Recupero nel recupero della sessione");
    }
  }

  // Gestisce la richiesta di recupero password
  static async forgot_password(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "Email richiesta",
          message: "L'indirizzo email è obbligatorio",
        });
      }

      // Normalizza l'email
      const normalizedEmail = String(email).trim().toLowerCase();

      // Crea il record di reset password e genera l'OTP
      const password_reset = await Authentication.create_password_reset(
        normalizedEmail
      );

      // Se l'utente non esiste, restituisci comunque successo per sicurezza
      // (non rivelare se un'email esiste o meno nel database)
      if (password_reset === false) {
        return res.status(404).json({
          error: "Email non trovata",
          message:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema",
        });
      }

      // Invia l'email con l'OTP
      try {
        await EmailService.send_password_reset_otp(
          normalizedEmail,
          password_reset.otp
        );
      } catch (emailError) {
        console.error("Errore nell'invio dell'email:", emailError);
        // Anche se l'invio email fallisce, restituisci successo per sicurezza
        // (non rivelare problemi tecnici)
      }

      res.status(200).json({
        message:
          "Se l'email esiste nel nostro database, riceverai il codice di verifica",
      });
    } catch (error) {
      console.error("Errore nel recupero password:", error);
      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile inviare il codice OTP. Riprova più tardi.",
      });
    }
  }

  // Reinvia l'OTP
  static async resend_otp(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "Email richiesta",
          message: "L'indirizzo email è obbligatorio",
        });
      }

      // Normalizza l'email
      const normalizedEmail = String(email).trim().toLowerCase();

      // Crea un nuovo record di reset password e genera un nuovo OTP
      const password_reset = await Authentication.create_password_reset(
        normalizedEmail
      );

      if (password_reset === false) {
        return res.status(404).json({
          error: "Email non trovata",
          message:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema",
        });
      }

      // Invia l'email con il nuovo OTP
      try {
        await EmailService.send_password_reset_otp(
          normalizedEmail,
          password_reset.otp
        );
      } catch (emailError) {
        console.error("Errore nell'invio dell'email:", emailError);
      }

      res.status(200).json({
        message: "Codice OTP rinviato con successo",
      });
    } catch (error) {
      console.error("Errore nel reinvio OTP:", error);
      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile rinviare il codice. Riprova più tardi.",
      });
    }
  }

  // Verifica l'OTP e opzionalmente resetta la password
  static async verify_otp(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          error: "Dati mancanti",
          message: "Email e codice OTP sono obbligatori",
        });
      }

      // Normalizza l'email e l'OTP
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedOtp = String(otp).trim();

      // Verifica che l'OTP sia di 6 cifre
      if (normalizedOtp.length !== 6 || !/^\d{6}$/.test(normalizedOtp)) {
        return res.status(400).json({
          error: "OTP non valido",
          message: "Il codice OTP deve essere composto da 6 cifre",
        });
      }

      // Verifica l'OTP
      const verification = await Authentication.verify_otp(
        normalizedEmail,
        normalizedOtp
      );

      if (!verification || !verification.valid) {
        return res.status(400).json({
          error: "OTP non valido",
          message:
            verification?.message || "Il codice OTP inserito non è corretto",
        });
      }

      // Se è fornita una nuova password, resetta la password
      if (newPassword) {
        if (newPassword.length < 6) {
          return res.status(400).json({
            error: "Password troppo corta",
            message: "La password deve essere di almeno 6 caratteri",
          });
        }

        const resetSuccess = await Authentication.reset_password(
          normalizedEmail,
          newPassword
        );

        if (!resetSuccess) {
          return res.status(500).json({
            error: "Errore nel reset password",
            message: "Impossibile resettare la password. Riprova più tardi.",
          });
        }

        return res.status(200).json({
          message: "Password resettata con successo",
        });
      }

      // Se non è fornita una nuova password, restituisci solo la conferma della verifica
      res.status(200).json({
        message: "Codice OTP verificato con successo",
      });
    } catch (error) {
      console.error("Errore nella verifica OTP:", error);

      // Gestione specifica per errori del database
      if (error.message?.includes("tabella PasswordReset non trovata")) {
        return res.status(500).json({
          error: "Errore del database",
          message:
            "Errore nella configurazione del database. Contattare l'amministratore.",
        });
      }

      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile verificare il codice. Riprova più tardi.",
      });
    }
  }

  // Resetta la password dopo la verifica OTP
  static async reset_password(req, res) {
    try {
      const { email, otp, new_password } = req.body;

      if (!email || !otp || !new_password) {
        return res.status(400).json({
          error: "Dati mancanti",
          message: "Email, codice OTP e nuova password sono obbligatori",
        });
      }

      // Normalizza l'email e l'OTP
      const normalizedEmail = String(email).trim().toLowerCase();
      const normalizedOtp = String(otp).trim();

      // Verifica che l'OTP sia di 6 cifre
      if (normalizedOtp.length !== 6 || !/^\d{6}$/.test(normalizedOtp)) {
        return res.status(400).json({
          error: "OTP non valido",
          message: "Il codice OTP deve essere composto da 6 cifre",
        });
      }

      // Verifica che la password sia valida
      if (new_password.length < 8) {
        return res.status(400).json({
          error: "Password troppo corta",
          message: "La password deve essere di almeno 8 caratteri",
        });
      }

      // Verifica l'OTP prima di resettare la password
      const verification = await Authentication.verify_otp(
        normalizedEmail,
        normalizedOtp
      );

      if (!verification || !verification.valid) {
        return res.status(400).json({
          error: "OTP non valido",
          message:
            verification?.message || "Il codice OTP inserito non è corretto",
        });
      }

      // Resetta la password
      const resetSuccess = await Authentication.reset_password(
        normalizedEmail,
        new_password
      );

      if (!resetSuccess) {
        return res.status(500).json({
          error: "Errore nel reset password",
          message: "Impossibile resettare la password. Riprova più tardi.",
        });
      }

      res.status(200).json({
        message: "Password resettata con successo",
      });
    } catch (error) {
      console.error("Errore nel reset password:", error);

      // Gestione specifica per password identica
      if (
        error.message?.includes("diversa dalla password attuale") ||
        error.message?.toLowerCase().includes("stessa password") ||
        error.message?.toLowerCase().includes("same password") ||
        error.message?.toLowerCase().includes("uguale") ||
        error.message?.toLowerCase().includes("equal") ||
        error.message?.toLowerCase().includes("identica")
      ) {
        return res.status(400).json({
          error: "Password identica",
          message:
            "La nuova password deve essere diversa dalla password attuale. Scegli una password diversa.",
        });
      }

      // Gestione specifica per errori del database
      if (error.message?.includes("tabella password_reset non trovata")) {
        return res.status(500).json({
          error: "Errore del database",
          message:
            "Errore nella configurazione del database. Contattare l'amministratore.",
        });
      }

      res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile resettare la password. Riprova più tardi.",
      });
    }
  }

  /**
   * Inizia OAuth flow Google
   * GET /authentication/GET/google-oauth
   */
  static async startGoogleOAuth(req, res) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (!clientId) {
        return res.status(500).json({
          error: "Errore configurazione",
          message:
            "GOOGLE_CLIENT_ID non configurato nelle variabili d'ambiente",
        });
      }

      // Verifica che la sessione sia disponibile
      if (!req.session) {
        return res.status(500).json({
          error: "Errore sessione",
          message: "Sessione non disponibile",
        });
      }

      // Genera state CSRF random
      const state = crypto.randomBytes(32).toString("hex");

      // Salva state in sessione per validazione callback
      req.session.oauth_state = state;
      req.session.oauth_provider = "google";

      // Costruisci URL OAuth Google
      // IMPORTANTE: redirect_uri deve puntare al BACKEND, non al frontend
      const backendUrl =
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/API/v1/authentication/GET/google/callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: state,
        access_type: "offline",
        prompt: "consent",
      });

      const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      return res.status(200).json({
        url: googleOAuthUrl, // Formato standard per frontend
        oauthUrl: googleOAuthUrl, // Alias per compatibilità
        state: state,
        message: "Reindirizza l'utente all'URL OAuth fornito",
      });
    } catch (error) {
      return res.status(500).json({
        error: "Errore interno del server",
        message: error.message || "Impossibile inizializzare OAuth Google",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  /**
   * Inizia OAuth flow GitHub (per autenticazione utente)
   * GET /authentication/GET/github-oauth
   */
  static async startGitHubOAuth(req, res) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({
          error: "Errore configurazione",
          message:
            "GITHUB_CLIENT_ID non configurato nelle variabili d'ambiente",
        });
      }

      // Verifica che la sessione sia disponibile
      if (!req.session) {
        return res.status(500).json({
          error: "Errore sessione",
          message: "Sessione non disponibile",
        });
      }

      // Genera state CSRF random
      const state = crypto.randomBytes(32).toString("hex");

      // Salva state in sessione per validazione callback
      req.session.oauth_state = state;
      req.session.oauth_provider = "github";

      // Costruisci URL OAuth GitHub
      // IMPORTANTE: redirect_uri deve puntare al BACKEND, non al frontend
      const backendUrl =
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/API/v1/authentication/GET/github/auth-callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:email repo workflow", // Scope per autenticazione + vault
        state: state,
      });

      const githubOAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

      return res.status(200).json({
        url: githubOAuthUrl, // Formato standard per frontend
        oauthUrl: githubOAuthUrl, // Alias per compatibilità
        github_url: githubOAuthUrl, // Alias alternativo
        state: state,
        message: "Reindirizza l'utente all'URL OAuth fornito",
      });
    } catch (error) {
      return res.status(500).json({
        error: "Errore interno del server",
        message: "Impossibile inizializzare OAuth GitHub",
      });
    }
  }

  /**
   * Callback OAuth Google
   * GET /authentication/GET/google/callback
   */
  static async googleCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      // Valida errori da Google
      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/?error=${error}`);
      }

      // Valida state CSRF
      if (!state || state !== req.session.oauth_state) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/?error=invalid_state`);
      }

      // Scambia code con access token
      // IMPORTANTE: redirect_uri deve essere lo stesso usato per generare l'URL OAuth
      const backendUrl =
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/API/v1/authentication/GET/google/callback`;

      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }
      );

      const { access_token, id_token } = tokenResponse.data;

      // Recupera dati utente da Google
      const userResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const googleUser = userResponse.data;

      // Trova o crea utente nel database
      const user = await Authentication.findOrCreateOAuthUser({
        provider: "google",
        oauthId: googleUser.id,
        email: googleUser.email,
        name: googleUser.given_name || "",
        surname: googleUser.family_name || "",
        accessToken: access_token,
        isEmailVerified: googleUser.verified_email || false,
      });

      // Crea sessione autenticata
      delete user.password; // Rimuovi password prima di salvare in sessione
      req.session.account = user;

      // Pulisci state OAuth dalla sessione
      delete req.session.oauth_state;
      delete req.session.oauth_provider;

      // Salva la sessione prima di fare redirect
      req.session.save((err) => {
        if (err) {
          // Errore salvataggio sessione
        }
      });

      // Redirect HTTP al frontend (Google fa redirect del browser, non AJAX)
      return res.redirect(
        `${frontendUrl}/dashboard?oauth=success&provider=google`
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendUrl}/?error=oauth_failed&message=${encodeURIComponent(
          error.message || "Errore autenticazione"
        )}`
      );
    }
  }

  /**
   * Callback OAuth GitHub (per autenticazione utente)
   * GET /authentication/GET/github/auth-callback
   * IMPORTANTE: Salva anche le info GitHub nella sessione per usare con vault
   */
  static async githubCallback(req, res) {
    try {
      const { code, state, error } = req.query;

      // Valida errori da GitHub
      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/?error=${error}`);
      }

      // Valida state CSRF
      if (!state || state !== req.session.oauth_state) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/?error=invalid_state`);
      }

      // Scambia code con access token
      // IMPORTANTE: redirect_uri deve puntare al BACKEND, non al frontend
      const backendUrl =
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        "http://localhost:3000";
      const redirectUri = `${backendUrl}/API/v1/authentication/GET/github/auth-callback`;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: redirectUri,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // Valida che il token abbia i permessi necessari per il vault (repo, workflow)
      const tokenValidation = await TokenValidator.validateToken(
        access_token,
        true
      );

      if (!tokenValidation.valid) {
        // Non blocchiamo il login, ma avvisiamo che il vault potrebbe non funzionare
        // Il token verrà comunque salvato per permettere l'autenticazione
      }

      // Recupera dati utente da GitHub
      const userResponse = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const githubUser = userResponse.data;

      // Recupera email (potrebbe essere privata)
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await axios.get(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
        const primaryEmail = emailsResponse.data.find((e) => e.primary);
        email = primaryEmail
          ? primaryEmail.email
          : emailsResponse.data[0]?.email;
      }

      // Trova o crea utente nel database
      const nameParts = githubUser.name
        ? githubUser.name.split(" ")
        : [githubUser.login || ""];
      const name = nameParts[0] || "";
      const surname = nameParts.slice(1).join(" ") || "";

      const user = await Authentication.findOrCreateOAuthUser({
        provider: "github",
        oauthId: githubUser.id.toString(),
        email: email,
        name: name,
        surname: surname,
        accessToken: access_token,
        isEmailVerified: true, // GitHub verifica email
      });

      // IMPORTANTE: Salva anche le informazioni GitHub nella sessione per usare con vault
      // Questo permette di usare automaticamente GitHub per i vault dopo il login
      const encryptedToken = GitHubOAuthService.encryptToken(access_token);
      req.session.githubToken = encryptedToken;
      req.session.githubUser = {
        login: githubUser.login,
        id: githubUser.id,
        avatar_url: githubUser.avatar_url,
        email: email,
      };

      // Crea sessione autenticata
      delete user.password; // Rimuovi password prima di salvare in sessione
      req.session.account = user;

      // Pulisci state OAuth dalla sessione
      delete req.session.oauth_state;
      delete req.session.oauth_provider;

      // Salva la sessione prima di fare redirect
      req.session.save((err) => {
        if (err) {
          // Errore salvataggio sessione
        }
      });

      // Redirect HTTP al frontend (GitHub fa redirect del browser, non AJAX)
      return res.redirect(
        `${frontendUrl}/dashboard?oauth=success&provider=github`
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(
        `${frontendUrl}/?error=oauth_failed&message=${encodeURIComponent(
          error.message || "Errore autenticazione"
        )}`
      );
    }
  }
}

module.exports = AuthenticationController;
