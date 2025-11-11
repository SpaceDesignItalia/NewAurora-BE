// services/github/example.js
// Esempio di utilizzo della crittografia libsodium per GitHub secrets
// QUESTO FILE È SOLO UN ESEMPIO - NON USARE IN PRODUZIONE CON VALORI REALI

const GitHubSecretEncryption = require('./encryptSecret');

// Esempio di utilizzo della crittografia GitHub Secret
async function testGitHubSecretEncryption() {
  console.log('=== Esempio Crittografia GitHub Secret (libsodium) ===\n');

  // Simula una chiave pubblica GitHub (questa è una chiave di esempio valida, non reale)
  // In produzione, questa viene recuperata da GitHub API
  const fakePublicKey = 'AVIDl7OefNqrDwB8PNIA4qL0TJqNXS9pvJH1eL9ktSA=';
  const secretValue = 'my-secret-value-example';

  try {
    console.log('Secret da crittografare:', secretValue);
    console.log('Chiave pubblica (base64):', fakePublicKey);

    // Cripta il secret
    const encrypted = await GitHubSecretEncryption.encryptSecret(
      secretValue,
      fakePublicKey
    );

    console.log('\nSecret crittografato (base64):', encrypted.substring(0, 50) + '...');
    console.log('Lunghezza crittografata:', encrypted.length, 'caratteri');

    // Valida la chiave pubblica
    const isValid = await GitHubSecretEncryption.validatePublicKey(fakePublicKey);
    console.log('\nChiave pubblica valida?', isValid ? '✓ SÌ' : '✗ NO');

    console.log('\n✓ Crittografia completata con successo!');
    console.log('\nNOTA: Il secret crittografato può essere inviato a GitHub API.');
    console.log('GitHub lo decritterà usando la chiave privata corrispondente.');

  } catch (error) {
    console.error('✗ Errore:', error.message);
  }
}

// Esegui l'esempio
testGitHubSecretEncryption()
  .then(() => {
    console.log('\n=== Test Completati ===');
    console.log('\nNOTA: Questo è solo un esempio con dati fittizi.');
    console.log('NON loggare mai secrets reali in produzione!');
  })
  .catch((error) => {
    console.error('Errore nell\'esecuzione del test:', error);
  });

