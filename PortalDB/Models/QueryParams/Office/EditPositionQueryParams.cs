using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.Office
{
    public class EditPositionQueryParams
    {
        [Required] public long PositionId { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string Acronym { get; set; } = string.Empty;
        [Required] public string SalaryGrade { get; set; } = string.Empty;
        [Required] public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
