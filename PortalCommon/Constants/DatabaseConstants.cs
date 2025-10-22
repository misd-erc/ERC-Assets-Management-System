
namespace PortalCommon.Constants
{
    /// <summary>
    /// Holds encrypted constants and configuration for database connections.
    /// Supports both Windows and SQL Authentication.
    /// </summary>
    public static class DatabaseConstants
    {

        public static readonly string Server = EnvironmentConstants.ERC_AMS_DB_SERVER;
        public static readonly string MainDatabaseName = EnvironmentConstants.ERC_AMS_DB_NAME;
        public static readonly string UserId = EnvironmentConstants.ERC_AMS_DB_USER;
        public static readonly string Password = EnvironmentConstants.ERC_AMS_DB_PASSWORD;
        public static readonly string Port = EnvironmentConstants.ERC_AMS_DB_PORT;
        public static readonly bool TrustServerCertificate = true;
        public static readonly bool IntegratedSecurity = true;

    }
}
