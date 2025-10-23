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
    }
}
