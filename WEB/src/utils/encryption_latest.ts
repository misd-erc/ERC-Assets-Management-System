import CryptoJS from 'crypto-js';

// Fallbacks are highly recommended just in case env variables fail to load
const SECRET_KEY = process.env.REACT_ENCRYPTION_KEY || '';
const SECRET_IV = process.env.REACT_ENCRYPTION_IV || '';

// AES requires keys and IVs to be parsed into WordArrays
const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
const iv = CryptoJS.enc.Utf8.parse(SECRET_IV);

export const cryptoUtil = {
  /**
   * Replaces btoa()
   */
  encrypt: (text: string): string => {
    if (!text) return text;
    try {
      const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      // Returns a base64 string of the encrypted data
      return encrypted.toString(); 
    } catch (error) {
      console.error('Encryption failed:', error);
      return '';
    }
  },

  /**
   * Replaces atob()
   */
  decrypt: (cipherText: string): string => {
    if (!cipherText) return cipherText;
    try {
      const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      // Converts the decrypted WordArray back to a UTF8 string
      const originalText = decrypted.toString(CryptoJS.enc.Utf8);
      
      // If decryption fails due to bad key/data, originalText might be empty
      if (!originalText) throw new Error('Malformed data');
      
      return originalText;
    } catch (error) {
      console.error('Decryption failed. Data may be tampered with:', error);
      return ''; // Return empty string to prevent app crashes on bad data
    }
  }
};