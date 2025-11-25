// services/crypto/example.js
// Esempio di utilizzo delle utility di crittografia
// QUESTO FILE È SOLO UN ESEMPIO - NON USARE IN PRODUZIONE CON VALORI REALI

require('dotenv').config();
const PATEncryption = require('./encryptPAT');

// Esempio di utilizzo della crittografia PAT
console.log('=== Esempio Crittografia PAT (GitHub Token) ===\n');

// Simula un token GitHub (NON un token reale)
const fakeToken = 'ghp_exampleToken123456789';

// Usa una chiave di test se ENCRYPT_KEY non è configurata
const testKey = process.env.ENCRYPT_KEY || 'test-encryption-key-for-example-only-32-chars';

try {
  // Cripta il token
  console.log('Token originale:', fakeToken);
  const encrypted = PATEncryption.encrypt(fakeToken, testKey);
  console.log('Token crittografato:', encrypted.substring(0, 50) + '...');
  console.log('Lunghezza crittografata:', encrypted.length, 'caratteri\n');

  // Verifica se è crittografato
  const isEncrypted = PATEncryption.isEncrypted(encrypted);
  console.log('È crittografato?', isEncrypted);

  // Decripta il token
  const decrypted = PATEncryption.decrypt(encrypted, testKey);
  console.log('Token decrittografato:', decrypted);
  console.log('Corrispondenza:', fakeToken === decrypted ? '✓ SUCCESSO' : '✗ ERRORE');

} catch (error) {
  console.error('Errore:', error.message);
}

console.log('\n=== Test Completati ===');
console.log('\nNOTA: Questo è solo un esempio con dati fittizi.');
console.log('NON loggare mai token o secrets reali in produzione!');

