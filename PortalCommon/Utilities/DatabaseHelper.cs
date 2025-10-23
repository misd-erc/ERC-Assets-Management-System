
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
            if (DatabaseConstants.INTEGRATED_SECURITY)
                return $"Server={EncryptionHelper.Decrypt(DatabaseConstants.SERVER)};" +
                       $"Database={EncryptionHelper.Decrypt(DatabaseConstants.MAIN_DATABASE_NAME)};" +
                       $"Integrated Security={DatabaseConstants.INTEGRATED_SECURITY};" +
                       $"TrustServerCertificate={DatabaseConstants.TRUST_SERVER_CERTIFICATE};";
            else
                return $"Server={EncryptionHelper.Decrypt(DatabaseConstants.SERVER)},{EncryptionHelper.Decrypt(DatabaseConstants.PORT)};" +
                       $"Database={EncryptionHelper.Decrypt(DatabaseConstants.MAIN_DATABASE_NAME)};" +
                       $"User Id={EncryptionHelper.Decrypt(DatabaseConstants.USER_ID)};" +
                       $"Password={EncryptionHelper.Decrypt(DatabaseConstants.PASSWORD)};" +
                       $"TrustServerCertificate={DatabaseConstants.TRUST_SERVER_CERTIFICATE};";
                      
        }
    }
}
