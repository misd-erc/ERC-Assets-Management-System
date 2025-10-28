using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Account
{
    public class EditSystemUserQueryParams
    {

        [Required] public string SystemUserIdEncrypted { get; set; } = string.Empty;
        [Required] public string SystemRoleIdEncrypted { get; set; } = string.Empty;
        [Required] public string OfficeIdEncrypted { get; set; } = string.Empty;
        [Required] public string DivisionIdEncrypted { get; set; } = string.Empty;
        [Required] public string EmploymentTypeIdEncrypted { get; set; } = string.Empty;
        [Required] public string PositionIdEncrypted { get; set; } = string.Empty;
        [Required] public string StatusIdEncrypted { get; set; } = string.Empty;
        [Required] public string IsActiveEncrypted { get; set; } = string.Empty;
        [Required] public string ActionBySystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
