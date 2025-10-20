using PortalTools.Utilities;
using PortalCommon.Constants;

namespace PortalCommon.Utilities
{
    public class DatabaseHelper
    {
        /// <summary>
        /// Builds and returns the decrypted connection string based on authentication mode.
        /// </summary>
        public static string ConnectionString()
        {
            if (DatabaseConstants.IntegratedSecurity)
                return $"Server={EncryptionHelper.Decrypt(DatabaseConstants.Server)};" +
                       $"Database={EncryptionHelper.Decrypt(DatabaseConstants.MainDatabaseName)};" +
                       $"Integrated Security={DatabaseConstants.IntegratedSecurity};" +
                       $"TrustServerCertificate={DatabaseConstants.TrustServerCertificate};";
            else
                return $"Server={EncryptionHelper.Decrypt(DatabaseConstants.Server)},{EncryptionHelper.Decrypt(DatabaseConstants.Port)};" +
                       $"Database={EncryptionHelper.Decrypt(DatabaseConstants.MainDatabaseName)};" +
                       $"User Id={EncryptionHelper.Decrypt(DatabaseConstants.UserId)};" +
                       $"Password={EncryptionHelper.Decrypt(DatabaseConstants.Password)};" +
                       $"TrustServerCertificate={DatabaseConstants.TrustServerCertificate};";
        }
    }
}
