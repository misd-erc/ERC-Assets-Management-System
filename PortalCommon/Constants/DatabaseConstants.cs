
namespace PortalCommon.Constants
{
    /// <summary>
    /// Holds encrypted constants and configuration for database connections.
    /// Supports both Windows and SQL Authentication.
    /// </summary>
    public static class DatabaseConstants
    {

        public static readonly string SERVER = EnvironmentConstants.ERC_AMS_DB_SERVER;
        public static readonly string MAIN_DATABASE_NAME = EnvironmentConstants.ERC_AMS_DB_NAME;
        public static readonly string USER_ID = EnvironmentConstants.ERC_AMS_DB_USER;
        public static readonly string PASSWORD = EnvironmentConstants.ERC_AMS_DB_PASSWORD;
        public static readonly string PORT = EnvironmentConstants.ERC_AMS_DB_PORT;
        public static readonly bool TRUST_SERVER_CERTIFICATE = true;
        public static readonly bool INTEGRATED_SECURITY = true;

    }
}
