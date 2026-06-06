// encryption.js
// WHY THIS FILE EXISTS:
// We need to encrypt sensitive user data (like phone numbers) before storing
// in the database. This file provides two helper functions: encrypt and decrypt.
// We use AES-256-CBC, a symmetric encryption algorithm built into Node.js crypto.

const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// The secret key from our .env file
// AES-256 requires exactly 32 bytes (characters)
const SECRET_KEY = process.env.AES_SECRET_KEY;

// AES-CBC needs a random "IV" (Initialization Vector) for each encryption
// The IV is 16 bytes for AES
const IV_LENGTH = 16;

// ENCRYPT: Takes plain text, returns encrypted string
function encrypt(text) {
  // Generate a new random IV every time we encrypt
  // This means the same phone number encrypted twice gives different output
  // (makes it harder for attackers to spot patterns)
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create the cipher using AES-256-CBC algorithm
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(SECRET_KEY),
    iv
  );

  // Encrypt the text
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Store the IV alongside the encrypted data (we need it to decrypt later)
  // Format: iv:encryptedData (both as hex strings)
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// DECRYPT: Takes encrypted string, returns plain text
function decrypt(encryptedText) {
  // Split the stored string back into IV and encrypted data
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');

  // Create the decipher using the same key and IV
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(SECRET_KEY),
    iv
  );

  // Decrypt and return the original text
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
