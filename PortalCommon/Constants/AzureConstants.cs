using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Constants
{
    public static class AzureConstants
    {

        public static readonly string TENANT_ID = EnvironmentConstants.ERC_AMS_AZURE_TENANT_ID;
        public static readonly string CLIENT_ID = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_ID;
        public static readonly string OBJECT_ID = EnvironmentConstants.ERC_AMS_AZURE_OBJECT_ID;
        public static readonly string CLIENT_SECRET_ID = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_SECRET_ID;
        public static readonly string CLIENT_SECRET_VALUE = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_SECRET_VALUE;
        public static readonly string AUTHORITY = EnvironmentConstants.ERC_AMS_AZURE_AUTHORITY;
        public static readonly string GRAPH_SCOPE = EnvironmentConstants.ERC_AMS_AZURE_GRAPH_SCOPE;
        public static readonly string BLOB_STORAGE_ACCOUNT_KEY = EnvironmentConstants.ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_KEY;
        public static readonly string BLOB_STORAGE_ACCOUNT_NAME = EnvironmentConstants.ERC_AMS_AZURE_BLOB_STORAGE_ACCOUNT_NAME;
        public static readonly string BLOB_STORAGE_CONTAINER_NAME = EnvironmentConstants.ERC_AMS_AZURE_BLOB_STORAGE_CONTAINER_NAME;
        public static readonly string BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL = EnvironmentConstants.ERC_AMS_AZURE_BLOB_STORAGE_DEFAULT_ENDPOINT_PROTOCOL;
        public static readonly string BLOB_STORAGE_ENDPOINT_SUFFIX = EnvironmentConstants.ERC_AMS_AZURE_BLOB_STORAGE_ENDPOINT_SUFFIX;

    }
}
