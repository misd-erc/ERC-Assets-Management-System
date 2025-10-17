using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.Session
{
    public class SessionTokenValidationQueryParams
    {
        public string SystemUserIdEncrypted { get; set; } = string.Empty;
        public string KeyEncrypted { get; set; } = string.Empty;
    }
}
