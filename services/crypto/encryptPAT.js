// services/crypto/encryptPAT.js
const crypto = require("crypto");

/**
 * Utility per crittografare/decrittografare token GitHub PAT usando AES-256-GCM
 * NOTA: Non loggare mai i token o i segreti
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bit per GCM
const AUTH_TAG_LENGTH = 16; // 128 bit
const SALT_LENGTH = 32;

class PATEncryption {
  /**
   * Deriva una chiave da una password usando PBKDF2
   * @param {string} password - Password master
   * @param {Buffer} salt - Salt per la derivazione
   * @returns {Buffer} - Chiave derivata
   */
  static deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
  }

  /**
   * Cripta un token GitHub PAT
   * @param {string} plaintext - Token in chiaro
   * @param {string} masterPassword - Password master per la crittografia (default: ENCRYPT_KEY da env)
   * @returns {string} - Token crittografato in formato base64 (salt:iv:authTag:encrypted)
   */
  static encrypt(plaintext, masterPassword = null) {
    if (!plaintext) {
      throw new Error("Token non può essere vuoto");
    }

    const password = masterPassword || process.env.ENCRYPT_KEY;
    if (!password) {
      throw new Error("Chiave di crittografia non configurata");
    }

    // Genera salt e IV casuali
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Deriva la chiave dalla password
    const key = this.deriveKey(password, salt);

    // Cripta il testo
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Ottieni l'auth tag
    const authTag = cipher.getAuthTag();

    // Combina salt:iv:authTag:encrypted in un unico stringa base64
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, "base64"),
    ]);

    return combined.toString("base64");
  }

  /**
   * Decripta un token GitHub PAT
   * @param {string} encryptedData - Token crittografato in formato base64
   * @param {string} masterPassword - Password master per la decrittografia (default: ENCRYPT_KEY da env)
   * @returns {string} - Token in chiaro
   */
  static decrypt(encryptedData, masterPassword = null) {
    if (!encryptedData) {
      throw new Error("Dati crittografati non possono essere vuoti");
    }

    const password = masterPassword || process.env.ENCRYPT_KEY;
    if (!password) {
      throw new Error("Chiave di crittografia non configurata");
    }

    try {
      // Decodifica il buffer combinato
      const combined = Buffer.from(encryptedData, "base64");

      // Estrai le componenti
      const salt = combined.slice(0, SALT_LENGTH);
      const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const authTag = combined.slice(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );
      const encrypted = combined.slice(
        SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
      );

      // Deriva la chiave dalla password
      const key = this.deriveKey(password, salt);

      // Decripta il testo
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "binary", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        "Errore nella decrittografia: token non valido o corrotto"
      );
    }
  }

  /**
   * Verifica se una stringa è crittografata
   * @param {string} data - Stringa da verificare
   * @returns {boolean} - True se sembra essere crittografata
   */
  static isEncrypted(data) {
    if (!data || typeof data !== "string") {
      return false;
    }

    try {
      const buffer = Buffer.from(data, "base64");
      // Verifica lunghezza minima: salt + iv + authTag + almeno 1 byte di dati
      return buffer.length >= SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
      return false;
    }
  }
}

module.exports = PATEncryption;
