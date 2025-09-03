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
}

module.exports = AuthenticationController;
