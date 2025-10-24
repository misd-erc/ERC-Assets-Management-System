using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Constants
{
    public class EnvironmentConstants
    {

        #region AZURE
        public static readonly string ERC_AMS_AZURE_CLIENT_ID = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_CLIENT_ID))!;
        public static readonly string ERC_AMS_AZURE_TENANT_ID = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_TENANT_ID))!;
        public static readonly string ERC_AMS_AZURE_OBJECT_ID = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_OBJECT_ID))!;
        public static readonly string ERC_AMS_AZURE_CLIENT_SECRET_VALUE = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_CLIENT_SECRET_VALUE))!;
        public static readonly string ERC_AMS_AZURE_CLIENT_SECRET_ID = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_CLIENT_SECRET_ID))!;
        public static readonly string ERC_AMS_AZURE_AUTHORITY = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_AUTHORITY))!;
        public static readonly string ERC_AMS_AZURE_GRAPH_SCOPE = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_GRAPH_SCOPE))!;
        public static readonly string ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_KEY = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_KEY))!;
        public static readonly string ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_NAME = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_NAME))!;
        public static readonly string ERC_AMS_AZURE_BLOB_STORAGE_CONTAINER_NAME = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_BLOB_STORAGE_CONTAINER_NAME))!;
        public static readonly string ERC_AMS_AZURE_BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL))!;
        public static readonly string ERC_AMS_AZURE_BLOB_STORAGE_ENDPOINT_SUFFIX = Environment.GetEnvironmentVariable(nameof(ERC_AMS_AZURE_BLOB_STORAGE_ENDPOINT_SUFFIX))!;
        #endregion

        #region Encryption
        public static readonly string ERC_AMS_ENCRYPTION_KEY = Environment.GetEnvironmentVariable(nameof(ERC_AMS_ENCRYPTION_KEY))!;
        public static readonly string ERC_AMS_ENCRYPTION_IV = Environment.GetEnvironmentVariable(nameof(ERC_AMS_ENCRYPTION_IV))!;
        #endregion

        #region Database
        public static readonly string ERC_AMS_DB_SERVER = Environment.GetEnvironmentVariable(nameof(ERC_AMS_DB_SERVER))!;
        public static readonly string ERC_AMS_DB_NAME = Environment.GetEnvironmentVariable(nameof(ERC_AMS_DB_NAME))!;
        public static readonly string ERC_AMS_DB_USER = Environment.GetEnvironmentVariable(nameof(ERC_AMS_DB_USER))!;
        public static readonly string ERC_AMS_DB_PASSWORD = Environment.GetEnvironmentVariable(nameof(ERC_AMS_DB_PASSWORD))!;
        public static readonly string ERC_AMS_DB_PORT = Environment.GetEnvironmentVariable(nameof(ERC_AMS_DB_PORT))!;
        #endregion

        #region Email
        public static readonly string ERC_AMS_EMAIL_NO_REPLY = Environment.GetEnvironmentVariable(nameof(ERC_AMS_EMAIL_NO_REPLY))!;
        #endregion

    }
}
