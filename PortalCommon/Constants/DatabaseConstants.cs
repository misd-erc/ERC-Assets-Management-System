using PortalTools.Utilities;

namespace PortalCommon.Constants
{
    /// <summary>
    /// Holds encrypted constants and configuration for database connections.
    /// Supports both Windows and SQL Authentication.
    /// </summary>
    public static class DatabaseConstants
    {

        public const string Server = "WoUe/OCHXrNOOK8yryE0LA==";          // Encrypted "MARK\\SQLEXPRESS"
        public const string MainDatabaseName = "HN/TTTr7rUobk+oihoeeSA=="; // Encrypted "AMSDev"
        public const string UserId = "OZW3iHtTQF9CtVqECovYAg==";          // Encrypted "sa"
        public const string Password = "Yt6Ekb5u5+zMWyzt7MQlSg==";         // Encrypted "P@ssw0rd123"
        public const bool TrustServerCertificate = true;
        public const bool IntegratedSecurity = true;

    }
}
