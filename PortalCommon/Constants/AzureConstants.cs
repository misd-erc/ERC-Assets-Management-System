using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Constants
{
    public static class AzureConstants
    {
        public static readonly string TenantId = EnvironmentConstants.ERC_AMS_AZURE_TENANT_ID;
        public static readonly string ClientId = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_ID;
        public static readonly string ObjectId = EnvironmentConstants.ERC_AMS_AZURE_OBJECT_ID;
        public static readonly string ClientSecretId = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_SECRET_ID;
        public static readonly string ClientSecretValue = EnvironmentConstants.ERC_AMS_AZURE_CLIENT_SECRET_VALUE;
        public static readonly string Authority = EnvironmentConstants.ERC_AMS_AZURE_AUTHORITY;
        public static readonly string GraphScope = EnvironmentConstants.ERC_AMS_AZURE_GRAPH_SCOPE;
    }
}
