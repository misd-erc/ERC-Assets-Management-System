using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.Account
{
    public class EditSystemUserQueryParams
    {
        public string SystemUserIdEncrypted { get; set; } = string.Empty;
        public string SystemRoleIdEncrypted { get; set; } = string.Empty;
        public string StatusIdEncrypted { get; set; } = string.Empty;
        public string IsActiveEncrypted { get; set; } = string.Empty;
        public string ActionBySystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
