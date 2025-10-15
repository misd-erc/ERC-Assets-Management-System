using PortalTools.Utilities;
using System;

namespace PortalCommon.ViewModels.Account
{
    public class UserValidationViewModel
    {
        public string EntraIdEncrypted { get; set; } = string.Empty;
        public string FirstNameEncrypted { get; set; } = string.Empty;
        public string LastNameEncrypted { get; set; } = string.Empty;
        public string EmailEncrypted { get; set; } = string.Empty;
    }
}
