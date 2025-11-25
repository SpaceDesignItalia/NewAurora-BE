# Setup Vault - Sistema di Gestione Key-Value

## Configurazione

### 1. Variabile d'Ambiente per la Cifratura

Aggiungi la seguente variabile d'ambiente nel file `.env`:

```env
VAULT_ENCRYPTION_KEY=your-32-character-encryption-key-here
```

**Importante:**
- La chiave deve essere di almeno 32 caratteri per AES-256
- Se più corta, verrà estesa automaticamente con hash SHA-256
- **NON condividere questa chiave** - è critica per la sicurezza
- Usa una chiave forte e casuale (es. generata con `openssl rand -base64 32`)

### 2. Generazione Chiave di Cifratura

Per generare una chiave sicura:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Endpoint API

### CRUD Operations

#### GET `/API/v1/project/:project_id/vault`
Ottiene tutte le entry del vault per un progetto.

**Response:**
```json
{
  "vault_entries": [
    {
      "vault_id": "1",
      "project_id": "1",
      "key": "DATABASE_URL",
      "value": "postgresql://...",
      "is_sensitive": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST `/API/v1/project/:project_id/vault`
Crea una nuova entry del vault.

**Body:**
```json
{
  "key": "API_KEY",
  "value": "secret-value",
  "is_sensitive": true
}
```

**Response:**
```json
{
  "message": "Entry del vault creata con successo",
  "vault_entry": { ... }
}
```

#### PUT `/API/v1/project/:project_id/vault/:vault_id`
Aggiorna un'entry del vault.

**Body:**
```json
{
  "key": "API_KEY",
  "value": "new-secret-value",
  "is_sensitive": true
}
```

#### DELETE `/API/v1/project/:project_id/vault/:vault_id`
Elimina un'entry del vault.

#### GET `/API/v1/project/:project_id/vault/:vault_id/history`
Ottiene la cronologia di modifiche di un'entry.

### Export Operations

#### GET `/API/v1/project/:project_id/vault/export?format={format}&filter_sensitive={true|false}`

Esporta le entry del vault in diversi formati.

**Query Parameters:**
- `format` (obbligatorio): `docker`, `k8s`, `kubernetes`, `cicd`, `ci`, `json`
- `filter_sensitive` (opzionale): `true` per escludere valori sensibili
- `secret_name` (opzionale, solo per K8s): Nome del Secret Kubernetes
- `namespace` (opzionale, solo per K8s): Namespace Kubernetes (default: `default`)

**Esempi:**

1. **Docker (.env):**
   ```
   GET /API/v1/project/1/vault/export?format=docker
   ```

2. **Kubernetes Secret:**
   ```
   GET /API/v1/project/1/vault/export?format=k8s&secret_name=my-secret&namespace=production
   ```

3. **CI/CD YAML:**
   ```
   GET /API/v1/project/1/vault/export?format=cicd&filter_sensitive=true
   ```

4. **JSON:**
   ```
   GET /API/v1/project/1/vault/export?format=json
   ```

## Sicurezza

### Cifratura Valori Sensibili

- I valori con `is_sensitive: true` vengono **automaticamente cifrati** nel database
- Utilizza AES-256-GCM per la cifratura simmetrica
- I valori vengono **automaticamente decifrati** quando letti
- La chiave di cifratura è memorizzata in `VAULT_ENCRYPTION_KEY`

### Validazioni

- **Key unica**: Ogni chiave deve essere unica per progetto
- **Key obbligatoria**: La chiave non può essere vuota
- **Trim automatico**: Spazi bianchi vengono rimossi automaticamente

## Logging

Tutti gli eventi CRUD vengono loggati con il formato:

```
[VAULT] {ACTION} - project_id: {id}, key: {key}, is_sensitive: {bool}
```

Dove `{ACTION}` può essere:
- `CREATE`: Creazione nuova entry
- `UPDATE`: Aggiornamento entry
- `DELETE`: Eliminazione entry
- `EXPORT`: Export in formato specifico

## Cronologia / Versioning

- Ogni modifica viene salvata automaticamente in `Vault_History`
- La cronologia include: key, value, is_sensitive, changed_at
- Accessibile tramite endpoint `/history`

## Integrazione Frontend

### Esempio React/Axios

```javascript
// GET entries
const getVaultEntries = async (projectId) => {
  const response = await axios.get(
    `/API/v1/project/${projectId}/vault`,
    { withCredentials: true }
  );
  return response.data.vault_entries;
};

// CREATE entry
const createVaultEntry = async (projectId, key, value, isSensitive) => {
  const response = await axios.post(
    `/API/v1/project/${projectId}/vault`,
    { key, value, is_sensitive: isSensitive },
    { withCredentials: true }
  );
  return response.data;
};

// UPDATE entry
const updateVaultEntry = async (projectId, vaultId, key, value, isSensitive) => {
  const response = await axios.put(
    `/API/v1/project/${projectId}/vault/${vaultId}`,
    { key, value, is_sensitive: isSensitive },
    { withCredentials: true }
  );
  return response.data;
};

// DELETE entry
const deleteVaultEntry = async (projectId, vaultId) => {
  const response = await axios.delete(
    `/API/v1/project/${projectId}/vault/${vaultId}`,
    { withCredentials: true }
  );
  return response.data;
};

// EXPORT
const exportVault = async (projectId, format, filterSensitive = false) => {
  const response = await axios.get(
    `/API/v1/project/${projectId}/vault/export`,
    {
      params: { format, filter_sensitive: filterSensitive },
      responseType: 'blob', // Importante per il download
      withCredentials: true
    }
  );
  
  // Crea un blob e scarica il file
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `vault-export-${projectId}.${format === 'docker' ? 'env' : 'yaml'}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

## Note Importanti

1. **Backup della chiave**: Assicurati di avere un backup sicuro di `VAULT_ENCRYPTION_KEY`
2. **Rotazione chiavi**: Se cambi la chiave, i valori esistenti non potranno essere decifrati
3. **Valori esistenti**: I valori già salvati senza cifratura verranno gestiti automaticamente (retrocompatibilità)
4. **Performance**: La cifratura/decifratura avviene in memoria, non impatta significativamente le performance

