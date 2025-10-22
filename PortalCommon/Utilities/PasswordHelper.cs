using System;
using System.Security.Cryptography;
using System.Text;

namespace PortalCommon.Utilities
{
    public static class PasswordHelper
    {
        private const int SaltSize = 16; // 128 bit
        private const int KeySize = 32;  // 256 bit
        private const int Iterations = 100_000; // PBKDF2 iteration count

        /// <summary>
        /// Hashes a plain text password using PBKDF2 with a random salt.
        /// </summary>
        /// <param name="password">The plain text password.</param>
        /// <returns>A base64-encoded string containing both salt and hash.</returns>
        public static string HashPassword(string password)
        {
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[SaltSize];
            rng.GetBytes(salt);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var key = pbkdf2.GetBytes(KeySize);

            // Combine salt + key for storage
            var hashBytes = new byte[SaltSize + KeySize];
            Buffer.BlockCopy(salt, 0, hashBytes, 0, SaltSize);
            Buffer.BlockCopy(key, 0, hashBytes, SaltSize, KeySize);

            return Convert.ToBase64String(hashBytes);
        }

        /// <summary>
        /// Verifies a plain text password against a stored hashed password.
        /// </summary>
        /// <param name="password">The plain text password to verify.</param>
        /// <param name="storedHash">The stored hash (salt + key, base64-encoded).</param>
        /// <returns>True if valid, false otherwise.</returns>
        public static bool VerifyPassword(string password, string storedHash)
        {
            var hashBytes = Convert.FromBase64String(storedHash);
            if (hashBytes.Length != SaltSize + KeySize)
                return false;

            var salt = new byte[SaltSize];
            Buffer.BlockCopy(hashBytes, 0, salt, 0, SaltSize);
            var storedKey = new byte[KeySize];
            Buffer.BlockCopy(hashBytes, SaltSize, storedKey, 0, KeySize);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            var computedKey = pbkdf2.GetBytes(KeySize);

            return CryptographicOperations.FixedTimeEquals(storedKey, computedKey);
        }
    }
}
