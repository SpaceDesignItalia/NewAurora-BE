/**
 * Servizio per esportare i valori del Vault in diversi formati
 * Supporta: Docker (.env), Kubernetes (Secret YAML), CI/CD (YAML snippet)
 */
class VaultExportService {
  /**
   * Esporta in formato Docker (.env)
   * @param {Array} vault_entries - Array di entry del vault
   * @param {boolean} filter_sensitive - Se true, esclude i valori sensibili
   * @returns {string} - Contenuto del file .env
   */
  static exportDocker(vault_entries, filter_sensitive = false) {
    let content = "# Docker Environment Variables\n";
    content += "# Generated from Vault\n\n";

    vault_entries.forEach((entry) => {
      if (filter_sensitive && entry.is_sensitive) {
        return; // Salta i valori sensibili se richiesto
      }

      // Escape caratteri speciali per .env
      const key = entry.key.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
      const value = entry.value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");

      content += `${key}="${value}"\n`;
    });

    return content;
  }

  /**
   * Esporta in formato Kubernetes Secret (YAML)
   * @param {Array} vault_entries - Array di entry del vault
   * @param {string} secret_name - Nome del Secret Kubernetes
   * @param {string} namespace - Namespace Kubernetes (default: default)
   * @param {boolean} filter_sensitive - Se true, esclude i valori sensibili
   * @returns {string} - YAML del Secret Kubernetes
   */
  static exportKubernetes(
    vault_entries,
    secret_name = "vault-secret",
    namespace = "default",
    filter_sensitive = false
  ) {
    let yaml = `apiVersion: v1
kind: Secret
metadata:
  name: ${secret_name}
  namespace: ${namespace}
type: Opaque
data:
`;

    vault_entries.forEach((entry) => {
      if (filter_sensitive && entry.is_sensitive) {
        return; // Salta i valori sensibili se richiesto
      }

      // Kubernetes richiede base64 encoding per i valori
      const key = entry.key.replace(/[^a-zA-Z0-9_]/g, "_");
      const valueBase64 = Buffer.from(entry.value, "utf8").toString("base64");

      yaml += `  ${key}: ${valueBase64}\n`;
    });

    return yaml;
  }

  /**
   * Esporta in formato CI/CD (YAML snippet per GitLab CI, GitHub Actions, etc.)
   * @param {Array} vault_entries - Array di entry del vault
   * @param {boolean} filter_sensitive - Se true, esclude i valori sensibili
   * @returns {string} - YAML snippet per CI/CD
   */
  static exportCICD(vault_entries, filter_sensitive = false) {
    let yaml = "# CI/CD Environment Variables\n";
    yaml += "# Use this snippet in your CI/CD configuration\n\n";
    yaml += "variables:\n";

    vault_entries.forEach((entry) => {
      if (filter_sensitive && entry.is_sensitive) {
        return; // Salta i valori sensibili se richiesto
      }

      // Escape caratteri speciali per YAML
      const key = entry.key.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
      let value = entry.value;

      // Escape per YAML se necessario
      if (value.includes(":") || value.includes("#") || value.includes("|")) {
        value = `"${value.replace(/"/g, '\\"')}"`;
      }

      yaml += `  ${key}: ${value}\n`;
    });

    return yaml;
  }

  /**
   * Esporta in formato JSON (utile per altri sistemi)
   * @param {Array} vault_entries - Array di entry del vault
   * @param {boolean} filter_sensitive - Se true, esclude i valori sensibili
   * @returns {string} - JSON string
   */
  static exportJSON(vault_entries, filter_sensitive = false) {
    const data = {};

    vault_entries.forEach((entry) => {
      if (filter_sensitive && entry.is_sensitive) {
        return; // Salta i valori sensibili se richiesto
      }

      data[entry.key] = entry.value;
    });

    return JSON.stringify(data, null, 2);
  }
}

module.exports = VaultExportService;
