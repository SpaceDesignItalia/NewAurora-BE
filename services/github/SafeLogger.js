// services/github/SafeLogger.js
const crypto = require("crypto");

/**
 * Service per logging sicuro - anonimo e pseudonimizzato
 * NON logga mai token, secrets o dati sensibili
 */

class SafeLogger {
  /**
   * Genera un hash pseudonimizzato da un identificatore
   * @param {string} identifier - Identificatore da pseudonimizzare
   * @returns {string} - Hash pseudonimizzato (primi 8 caratteri)
   */
  static pseudonymize(identifier) {
    if (!identifier) return "anonymous";
    return crypto
      .createHash("sha256")
      .update(String(identifier))
      .digest("hex")
      .substring(0, 8);
  }

  /**
   * Log operazione GitHub con dati pseudonimizzati
   * @param {string} operation - Nome operazione (es: "list_repos", "push_secret")
   * @param {object} metadata - Metadati opzionali (NON includere token/secrets)
   * @param {string} userId - ID utente (sarà pseudonimizzato)
   */
  static logOperation(operation, metadata = {}, userId = null) {
    const timestamp = new Date().toISOString();
    const userHash = userId ? this.pseudonymize(userId) : "anonymous";

    // Filtra metadati per rimuovere dati sensibili
    const safeMetadata = this.sanitizeMetadata(metadata);

    const logEntry = {
      timestamp,
      operation,
      user: userHash,
      metadata: safeMetadata,
    };

    // Log in console (in produzione usare un sistema di logging)
    console.log(`[GitHub Operation] ${JSON.stringify(logEntry)}`);

    return logEntry;
  }

  /**
   * Sanitizza metadati rimuovendo dati sensibili
   * @param {object} metadata - Metadati da sanitizzare
   * @returns {object} - Metadati sicuri
   */
  static sanitizeMetadata(metadata) {
    const sensitiveKeys = [
      "token",
      "secret",
      "password",
      "key",
      "credential",
      "auth",
      "githubToken",
      "secretValue",
      "access_token",
      "refresh_token",
    ];

    const safe = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();

      // Salta chiavi sensibili
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        safe[key] = "[REDACTED]";
        continue;
      }

      // Se è un oggetto, sanitizza ricorsivamente
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        safe[key] = this.sanitizeMetadata(value);
        continue;
      }

      // Se è un array, sanitizza ogni elemento
      if (Array.isArray(value)) {
        safe[key] = value.map((item) =>
          typeof item === "object" ? this.sanitizeMetadata(item) : item
        );
        continue;
      }

      // Pseudonimizza repository full_name se presente
      if (key === "repoFullName" || key === "full_name") {
        safe[key] = this.pseudonymize(value);
        continue;
      }

      safe[key] = value;
    }

    return safe;
  }

  /**
   * Log errore senza esporre dati sensibili
   * @param {string} operation - Nome operazione
   * @param {Error} error - Errore
   * @param {object} context - Contesto opzionale (sanitizzato)
   */
  static logError(operation, error, context = {}) {
    const timestamp = new Date().toISOString();
    const safeContext = this.sanitizeMetadata(context);

    const logEntry = {
      timestamp,
      operation,
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      },
      context: safeContext,
    };

    console.error(`[GitHub Error] ${JSON.stringify(logEntry)}`);

    return logEntry;
  }

  /**
   * Log successo operazione
   * @param {string} operation - Nome operazione
   * @param {object} result - Risultato (sanitizzato)
   */
  static logSuccess(operation, result = {}) {
    const timestamp = new Date().toISOString();
    const safeResult = this.sanitizeMetadata(result);

    const logEntry = {
      timestamp,
      operation,
      status: "success",
      result: safeResult,
    };

    console.log(`[GitHub Success] ${JSON.stringify(logEntry)}`);

    return logEntry;
  }
}

module.exports = SafeLogger;
