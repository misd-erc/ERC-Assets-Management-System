import CryptoJS from 'crypto-js';

// 32 bytes key for AES-256
const KEY = CryptoJS.enc.Utf8.parse('?rv$bwB9SKbYQSw*GZyQ?&x7mHC2kkJD');
// 16 bytes IV
const IV = CryptoJS.enc.Utf8.parse('NDZE5W*##cENbgWk');

/**
 * Encrypts plain text into Base64 string using AES-256-CBC.
 * Matches the C# EncryptionHelper.Encrypt method.
 */
export function encrypt(plainText: string): string {
  if (!plainText) return plainText;

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainText), KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // Important: use ciphertext.toString() instead of encrypted.toString()
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}


/**
 * Decrypts Base64 string back to plain text using AES-256.
 * Matches the C# EncryptionHelper.Decrypt method.
 */
export function decrypt(cipherText: string): string {
  if (!cipherText) return cipherText;

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Base64.parse(cipherText) } as any,
    KEY,
    {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
/**
 * Encrypts to raw byte array (Uint8Array) instead of Base64.
 * Matches the C# EncryptionHelper.EncryptToBytes method.
 */
export function encryptToBytes(plainText: string): Uint8Array {
  if (!plainText) return new Uint8Array();

  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainText), KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const wordArray = encrypted.ciphertext;
  const sigBytes = wordArray.sigBytes;
  const words = wordArray.words;

  const uInt8Array = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    uInt8Array[i] = byte;
  }

  return uInt8Array;
}

/**
 * Decrypts raw byte array (Uint8Array) to string.
 * Matches the C# EncryptionHelper.DecryptFromBytes method.
 */
export function decryptFromBytes(cipherBytes: Uint8Array): string {
  if (!cipherBytes || cipherBytes.length === 0) return '';

  // Convert Uint8Array to CryptoJS WordArray
  const wordArray = CryptoJS.lib.WordArray.create(cipherBytes);

  const decrypted = CryptoJS.AES.decrypt({ ciphertext: wordArray } as any, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}