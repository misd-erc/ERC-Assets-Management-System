using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.Account
{
    public class EditSystemUserQueryParams
    {

        [Required] public string SystemUserIdEncrypted { get; set; } = string.Empty;
        [Required] public string SystemRoleIdEncrypted { get; set; } = string.Empty;
        [Required] public string StatusIdEncrypted { get; set; } = string.Empty;
        [Required] public string IsActiveEncrypted { get; set; } = string.Empty;
        [Required] public string ActionBySystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
