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
        /// Supports large text by streaming.
        /// </summary>
        public static string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.KEY;
            aes.IV = EncryptionConstants.IV;

            using var ms = new MemoryStream();
            using (var cryptoStream = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cryptoStream, Encoding.UTF8))
            {
                sw.Write(plainText);
            }

            // Return Base64 string
            return Convert.ToBase64String(ms.ToArray());
        }

        /// <summary>
        /// Decrypts Base64 string back to plain text.
        /// Supports large text by streaming.
        /// </summary>
        public static string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            var cipherBytes = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.KEY;
            aes.IV = EncryptionConstants.IV;

            using var ms = new MemoryStream(cipherBytes);
            using var cryptoStream = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
            using var sr = new StreamReader(cryptoStream, Encoding.UTF8);

            return sr.ReadToEnd();
        }

        /// <summary>
        /// Encrypts to raw byte array instead of Base64 (safer for very long text)
        /// </summary>
        public static byte[] EncryptToBytes(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return Array.Empty<byte>();

            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.KEY;
            aes.IV = EncryptionConstants.IV;

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
                return null!;

            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.KEY;
            aes.IV = EncryptionConstants.IV;

            using var ms = new MemoryStream(cipherBytes);
            using var cryptoStream = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
            using var sr = new StreamReader(cryptoStream, Encoding.UTF8);

            return sr.ReadToEnd();
        }
    }
}
