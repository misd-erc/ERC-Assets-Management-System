using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ViewModels.Account
{
    public class UserEncryptedPublicViewModel
    {
        public string SystemUserIdEncrypted { get; set; } = string.Empty;
        public string FirstNameEncrypted { get; set; } = string.Empty;
        public string LastNameEncrypted { get; set; } = string.Empty;
        public string EmailEncrypted { get; set; } = string.Empty;
        public string ExpiryTokenEncrypted { get; set; } = string.Empty;
    }
}
