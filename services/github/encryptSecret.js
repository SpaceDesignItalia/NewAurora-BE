// services/github/encryptSecret.js
const sodium = require("libsodium-wrappers");

/**
 * Utility per crittografare secrets usando libsodium per GitHub Actions
 * Utilizza sealed boxes (crypto_box_seal) come richiesto da GitHub API
 * NOTA: Non loggare mai i segreti
 */

class GitHubSecretEncryption {
  /**
   * Inizializza libsodium (deve essere chiamato prima di usare le funzioni)
   */
  static async init() {
    await sodium.ready;
  }

  /**
   * Cripta un secret usando la chiave pubblica del repository GitHub
   * @param {string} secretValue - Valore del secret in chiaro
   * @param {string} publicKey - Chiave pubblica del repository (base64)
   * @returns {string} - Secret crittografato in formato base64
   */
  static async encryptSecret(secretValue, publicKey) {
    if (!secretValue) {
      throw new Error("Il valore del secret non può essere vuoto");
    }

    if (!publicKey) {
      throw new Error("La chiave pubblica non può essere vuota");
    }

    try {
      // Assicurati che sodium sia pronto
      await this.init();

      // Converti la chiave pubblica da base64 a Uint8Array
      const publicKeyBytes = sodium.from_base64(
        publicKey,
        sodium.base64_variants.ORIGINAL
      );

      // Converti il secret in Uint8Array
      const secretBytes = sodium.from_string(secretValue);

      // Cripta usando sealed box (crypto_box_seal)
      const encryptedBytes = sodium.crypto_box_seal(
        secretBytes,
        publicKeyBytes
      );

      // Converti il risultato in base64
      const encryptedBase64 = sodium.to_base64(
        encryptedBytes,
        sodium.base64_variants.ORIGINAL
      );

      return encryptedBase64;
    } catch (error) {
      // Non loggare l'errore originale per sicurezza
      throw new Error("Errore nella crittografia del secret");
    }
  }

  /**
   * Valida una chiave pubblica GitHub
   * @param {string} publicKey - Chiave pubblica in base64
   * @returns {boolean} - True se la chiave è valida
   */
  static async validatePublicKey(publicKey) {
    if (!publicKey || typeof publicKey !== "string") {
      return false;
    }

    try {
      await this.init();
      const publicKeyBytes = sodium.from_base64(
        publicKey,
        sodium.base64_variants.ORIGINAL
      );

      // La chiave pubblica per sealed box deve essere 32 bytes
      return publicKeyBytes.length === sodium.crypto_box_PUBLICKEYBYTES;
    } catch {
      return false;
    }
  }
}

module.exports = GitHubSecretEncryption;
