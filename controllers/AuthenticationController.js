// controller/AuthenticationController.js
const Authentication = require("../Models/AuthenticationModel");
const EmailService = require("../middlewares/EmailService/EmailService");

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
      // Distruggi la sessione
      req.session.destroy((err) => {
        if (err) {
          console.error("Errore durante il logout:", err);
          return res.status(500).json({ error: "Errore interno del server" });
        }
        // Se la sessione è stata distrutta con successo, restituisci uno stato 200 (OK)
        return res
          .status(200)
          .json({ message: "Logout effettuato con successo" });
      });
    } catch (error) {
      console.error("Errore durante il logout:", error);
      return res.status(500).json({ error: "Errore interno del server" });
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
  static async forgotPassword(req, res) {
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
      const passwordReset = await Authentication.createPasswordReset(
        normalizedEmail
      );

      // Se l'utente non esiste, restituisci comunque successo per sicurezza
      // (non rivelare se un'email esiste o meno nel database)
      if (passwordReset === false) {
        return res.status(404).json({
          error: "Email non trovata",
          message:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema",
        });
      }

      // Invia l'email con l'OTP
      try {
        await EmailService.sendPasswordResetOTP(
          normalizedEmail,
          passwordReset.otp
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
  static async resendOTP(req, res) {
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
      const passwordReset = await Authentication.createPasswordReset(
        normalizedEmail
      );

      if (passwordReset === false) {
        return res.status(404).json({
          error: "Email non trovata",
          message:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema",
        });
      }

      // Invia l'email con il nuovo OTP
      try {
        await EmailService.sendPasswordResetOTP(
          normalizedEmail,
          passwordReset.otp
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
  static async verifyOTP(req, res) {
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
      const verification = await Authentication.verifyOTP(
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

        const resetSuccess = await Authentication.resetPassword(
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
  static async resetPassword(req, res) {
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
      const verification = await Authentication.verifyOTP(
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
      const resetSuccess = await Authentication.resetPassword(
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
      if (error.message?.includes("tabella PasswordReset non trovata")) {
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
}

module.exports = AuthenticationController;
