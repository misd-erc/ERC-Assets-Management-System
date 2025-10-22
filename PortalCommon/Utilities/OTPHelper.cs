using System;
using System.Security.Cryptography;
using System.Text;

namespace PortalCommon.Utilities
{
    public static class OTPHelper
    {
        /// <summary>
        /// Generates a random numeric OTP code and returns it as a long.
        /// </summary>
        /// <param name="length">Length of OTP (default = 6)</param>
        /// <returns>Numeric OTP as long</returns>
        public static long GenerateNumericOTP(int length = 6)
        {
            if (length <= 0)
                throw new ArgumentException("OTP length must be greater than zero.", nameof(length));

            var randomNumber = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
            }

            var otpBuilder = new StringBuilder(length);
            foreach (var b in randomNumber)
            {
                otpBuilder.Append(b % 10);
            }

            // Ensure fixed length by padding with zeros on the left
            var otpString = otpBuilder.ToString().PadLeft(length, '0').Substring(0, length);

            if (long.TryParse(otpString, out var otpValue))
                return otpValue;

            return 0;
        }

        /// <summary>
        /// Generates an alphanumeric OTP (mix of letters and numbers).
        /// </summary>
        /// <param name="length">Length of OTP (default = 8)</param>
        /// <returns>Alphanumeric OTP string</returns>
        public static string GenerateAlphaNumericOTP(int length = 8)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var data = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(data);
            }

            var otpBuilder = new StringBuilder(length);
            foreach (var b in data)
            {
                otpBuilder.Append(chars[b % chars.Length]);
            }

            return otpBuilder.ToString();
        }

        /// <summary>
        /// Generates a time-based OTP (with expiration) and SHA256 hash for validation.
        /// </summary>
        /// <param name="secret">Unique key per user (e.g., email or user ID)</param>
        /// <param name="expiryMinutes">Validity in minutes</param>
        /// <returns>Tuple of OTP string and expiry DateTime</returns>
        public static (long Otp, DateTime Expiry) GenerateTimedOTP(string secret, int expiryMinutes = 5)
        {
            var otp = new Random().Next(100000, 999999);
            var expiry = DateTime.UtcNow.AddMinutes(expiryMinutes);

            // Optionally, use the hash for verification
            var combined = $"{secret}:{otp}:{expiry:O}";
            var _ = ComputeSHA256(combined); // Not returned, but could be stored or verified later

            return (otp, expiry);
        }

        /// <summary>
        /// Checks if an OTP is still valid based on its expiry time.
        /// </summary>
        public static bool IsOtpValid(DateTime expiry)
        {
            return DateTime.UtcNow <= expiry;
        }

        private static string ComputeSHA256(string rawData)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                var builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}
