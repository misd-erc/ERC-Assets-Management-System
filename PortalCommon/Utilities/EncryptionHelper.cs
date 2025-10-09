using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using PortalCommon.Constants;

namespace PortalTools.Utilities
{
    public static class EncryptionHelper
    {
        public static string Encrypt(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.Key;
            aes.IV = EncryptionConstants.IV;

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs))
                sw.Write(plainText);

            return Convert.ToBase64String(ms.ToArray());
        }

        public static string Decrypt(string cipherText)
        {
            using var aes = Aes.Create();
            aes.Key = EncryptionConstants.Key;
            aes.IV = EncryptionConstants.IV;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(Convert.FromBase64String(cipherText));
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            return sr.ReadToEnd();
        }
    }
}
