const crypto = require("crypto");

/**
 * Servizio per cifrare e decifrare i valori sensibili del Vault
 * Utilizza AES-256-GCM per la cifratura simmetrica
 */
class VaultEncryptionService {
  // Chiave di cifratura da variabile d'ambiente (deve essere 32 bytes per AES-256)
  static getEncryptionKey() {
    const key = process.env.VAULT_ENCRYPTION_KEY;
    if (!key) {
      // Se la chiave non è configurata, ritorna null (cifratura disabilitata)
      console.warn(
        "[VAULT] WARNING: VAULT_ENCRYPTION_KEY non configurata. I valori sensibili verranno salvati in chiaro."
      );
      return null;
    }
    // Se la chiave è più corta di 32 bytes, la estendiamo con hash
    if (key.length < 32) {
      return crypto.createHash("sha256").update(key).digest();
    }
    return Buffer.from(key.slice(0, 32), "utf8");
  }

  /**
   * Cifra un valore sensibile
   * @param {string} plaintext - Valore da cifrare
   * @returns {string} - Valore cifrato in formato base64 (iv:tag:ciphertext)
   */
  static encrypt(plaintext) {
    try {
      if (!plaintext) return plaintext;

      const key = this.getEncryptionKey();

      // Se la chiave non è configurata, ritorna il valore in chiaro
      if (!key) {
        console.warn(
          "[VAULT] WARNING: Cifratura disabilitata. Valore salvato in chiaro."
        );
        return plaintext;
      }

      const algorithm = "aes-256-gcm";
      const iv = crypto.randomBytes(16); // Initialization Vector

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(plaintext, "utf8", "base64");
      encrypted += cipher.final("base64");

      const authTag = cipher.getAuthTag();

      // Formato: iv:authTag:encrypted (tutti in base64)
      return `${iv.toString("base64")}:${authTag.toString(
        "base64"
      )}:${encrypted}`;
    } catch (error) {
      console.error("Errore nella cifratura:", error);
      // In caso di errore, ritorna il valore in chiaro invece di fallire
      console.warn(
        "[VAULT] WARNING: Errore nella cifratura. Valore salvato in chiaro."
      );
      return plaintext;
    }
  }

  /**
   * Decifra un valore sensibile
   * @param {string} ciphertext - Valore cifrato in formato base64 (iv:tag:ciphertext) o plaintext
   * @returns {string} - Valore decifrato
   */
  static decrypt(ciphertext) {
    try {
      if (!ciphertext) return ciphertext;

      // Verifica se il valore è già cifrato (contiene i separatori :)
      if (!ciphertext.includes(":")) {
        // Valore non cifrato (per retrocompatibilità o cifratura disabilitata)
        return ciphertext;
      }

      const parts = ciphertext.split(":");
      if (parts.length !== 3) {
        // Formato non valido, ritorna il valore originale
        console.warn(
          "[VAULT] WARNING: Formato cifratura non valido. Ritorno valore originale."
        );
        return ciphertext;
      }

      const key = this.getEncryptionKey();

      // Se la chiave non è configurata ma il valore è cifrato, non possiamo decifrarlo
      if (!key) {
        console.warn(
          "[VAULT] WARNING: Valore cifrato ma VAULT_ENCRYPTION_KEY non configurata. Impossibile decifrare."
        );
        return ciphertext; // Ritorna il valore cifrato
      }

      const [ivBase64, authTagBase64, encrypted] = parts;
      const algorithm = "aes-256-gcm";
      const iv = Buffer.from(ivBase64, "base64");
      const authTag = Buffer.from(authTagBase64, "base64");

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Errore nella decifratura:", error);
      // In caso di errore, ritorna il valore originale invece di fallire
      console.warn(
        "[VAULT] WARNING: Errore nella decifratura. Ritorno valore originale."
      );
      return ciphertext;
    }
  }
}

module.exports = VaultEncryptionService;
