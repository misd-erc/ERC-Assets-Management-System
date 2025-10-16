// Test script to verify encryption/decryption compatibility with C# backend
import { encrypt, decrypt } from './encryption';

console.log('Testing encryption/decryption compatibility...');

// Test data that matches the C# constants
const testKey = "?rv$bwB9SKbYQSw*GZyQ?&x7mHC2kkJD";
const testIV = "NDZE5W*##cENbgWk";

// Test strings
const testStrings = [
  "test@example.com",
  "John",
  "Doe",
  "123456789",
  "Hello World!",
  "Special chars: !@#$%^&*()",
  "Unicode: 你好世界 🌍"
];

console.log('Key:', testKey);
console.log('IV:', testIV);
console.log('');

testStrings.forEach((testString, index) => {
  console.log(`Test ${index + 1}: "${testString}"`);

  try {
    const encrypted = encrypt(testString);
    console.log('Encrypted:', encrypted);

    const decrypted = decrypt(encrypted);
    console.log('Decrypted:', decrypted);

    const success = testString === decrypted;
    console.log('Match:', success ? '✅' : '❌');

    if (!success) {
      console.error('MISMATCH! Original:', testString, 'Decrypted:', decrypted);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('---');
});

// Test with specific values that might be used in the API
console.log('API-specific tests:');
const entraId = "1234567890123456"; // Example Entra ID
const email = "user@erc.gov.ph";
const firstName = "Juan";
const lastName = "Dela Cruz";

console.log('Entra ID:', entraId);
console.log('Encrypted Entra ID:', encrypt(entraId));
console.log('Email:', email);
console.log('Encrypted Email:', encrypt(email));
console.log('First Name:', firstName);
console.log('Encrypted First Name:', encrypt(firstName));
console.log('Last Name:', lastName);
console.log('Encrypted Last Name:', encrypt(lastName));

// Test OTP
const otp = "123456";
console.log('OTP:', otp);
console.log('Encrypted OTP:', encrypt(otp));

// Test session token
const sessionToken = "session-token-123456789";
console.log('Session Token:', sessionToken);
console.log('Encrypted Session Token:', encrypt(sessionToken));
