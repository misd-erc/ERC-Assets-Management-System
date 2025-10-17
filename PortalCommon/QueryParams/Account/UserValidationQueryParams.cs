using PortalTools.Utilities;
using System;

namespace PortalCommon.QueryParams.Account
{
    public class UserValidationQueryParams
    {
        public string EntraIdEncrypted { get; set; } = string.Empty;
        public string FirstNameEncrypted { get; set; } = string.Empty;
        public string LastNameEncrypted { get; set; } = string.Empty;
        public string EmailEncrypted { get; set; } = string.Empty;
    }
}
