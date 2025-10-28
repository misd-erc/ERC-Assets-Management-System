using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using PortalCommon.Constants;

namespace PortalCommon.Utilities
{
    public static class EncryptionHelper
    {
        /// <summary>
        /// Encrypts plain text into Base64 string.
        /// </summary>
        public static string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using var aes = CreateAes();

            using var ms = new MemoryStream();
            using (var cryptoStream = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cryptoStream, Encoding.UTF8))
            {
                sw.Write(plainText);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        /// <summary>
        /// Decrypts Base64 string back to plain text.
        /// </summary>
        public static string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            var cipherBytes = Convert.FromBase64String(cipherText);

            using var aes = CreateAes();
            using var ms = new MemoryStream(cipherBytes);
            using var cryptoStream = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
            using var sr = new StreamReader(cryptoStream, Encoding.UTF8);

            return sr.ReadToEnd();
        }

        /// <summary>
        /// Encrypts to raw byte array instead of Base64 (for binary usage)
        /// </summary>
        public static byte[] EncryptToBytes(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return Array.Empty<byte>();

            using var aes = CreateAes();

            using var ms = new MemoryStream();
            using (var cryptoStream = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cryptoStream, Encoding.UTF8))
            {
                sw.Write(plainText);
            }

            return ms.ToArray();
        }

        /// <summary>
        /// Decrypts raw byte array to string
        /// </summary>
        public static string DecryptFromBytes(byte[] cipherBytes)
        {
            if (cipherBytes == null || cipherBytes.Length == 0)
                return string.Empty;

            using var aes = CreateAes();
            using var ms = new MemoryStream(cipherBytes);
            using var cryptoStream = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
            using var sr = new StreamReader(cryptoStream, Encoding.UTF8);

            return sr.ReadToEnd();
        }

        /// <summary>
        /// Creates and validates an AES instance with configured key & IV.
        /// </summary>
        private static Aes CreateAes()
        {
            var aes = Aes.Create();
            aes.Key = EncryptionConstants.KEY;
            aes.IV = EncryptionConstants.IV;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            ValidateKeyAndIv(aes.Key, aes.IV);
            return aes;
        }

        /// <summary>
        /// Ensures AES key and IV are valid lengths before use.
        /// </summary>
        private static void ValidateKeyAndIv(byte[] key, byte[] iv)
        {
            if (key == null || (key.Length != 16 && key.Length != 24 && key.Length != 32))
                throw new ArgumentException($"Invalid AES key length ({key?.Length ?? 0}). Must be 16, 24, or 32 bytes.");

            if (iv == null || iv.Length != 16)
                throw new ArgumentException($"Invalid AES IV length ({iv?.Length ?? 0}). Must be 16 bytes.");
        }
    }
}
