import { cryptoUtil } from './encryption_latest'; // Make sure this path points to your new utility

export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      // 1. Encrypt the key, then base64 encode it
      const secureKey = cryptoUtil.encrypt(key);
      const encodedKey = btoa(secureKey);
      
      // 2. Encrypt the value, then URI encode, then base64 encode it
      const secureValue = cryptoUtil.encrypt(value);
      const encodedValue = btoa(encodeURIComponent(secureValue)); 
      localStorage.setItem(encodedKey, encodedValue);
    } catch (error) {
      console.error("Error encoding to localStorage", error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      // 1. Recreate the exact encrypted and encoded key to find it in storage
      const secureKey = cryptoUtil.encrypt(key);
      const encodedKey = btoa(secureKey);
      
      const encodedValue = localStorage.getItem(encodedKey);
      
      if (!encodedValue) return null;
      
      // 2. Decode btoa -> Decode URI -> Decrypt AES
      const decodedUriValue = decodeURIComponent(atob(encodedValue));
      return cryptoUtil.decrypt(decodedUriValue);
      
    } catch (error) {
      console.error("Error decoding from localStorage", error);
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      // 1. Recreate the exact encrypted and encoded key to target it for removal
      const secureKey = cryptoUtil.encrypt(key);
      const encodedKey = btoa(secureKey);
      
      localStorage.removeItem(encodedKey);

    } catch (error) {
      console.error("Error removing from localStorage", error);
    }
  }
};