using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.Account
{
    public class EditSystemUserQueryParams
    {
        [Required] public long SystemUserId { get; set; }
        [Required] public long SystemRoleId { get; set; }
        [Required] public long OfficeId { get; set; }
        [Required] public long DivisionId { get; set; }
        [Required] public long EmploymentTypeId { get; set; }
        [Required] public long PositionId { get; set; }
        [Required] public long StatusId { get; set; }
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
