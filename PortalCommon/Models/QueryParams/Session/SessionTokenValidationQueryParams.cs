using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Session
{
    public class SessionTokenValidationQueryParams
    {
        [Required] public string SystemUserIdEncrypted { get; set; } = string.Empty;
        [Required] public string KeyEncrypted { get; set; } = string.Empty;
    }
}
