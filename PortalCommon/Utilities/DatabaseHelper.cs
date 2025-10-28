
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
            //return EncryptionHelper.Decrypt(DatabaseConstants.MAIN_DATABASE);

            return "Data Source=JEYMS;Initial Catalog=amsDev;Integrated Security=True;Trust Server Certificate=True;";

        }
    }
}
