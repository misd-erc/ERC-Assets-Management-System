using PortalTools.Utilities;
using System;

namespace PortalCommon.ViewModels.Account
{
    public class UserValidationViewModel
    {
        public string EntraId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
