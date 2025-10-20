using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ResponseModels.Account
{
    public class UserPublicResponseModel
    {
        public string SystemUserIdEncrypted { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ExpiryToken { get; set; } = string.Empty;
    }
}
