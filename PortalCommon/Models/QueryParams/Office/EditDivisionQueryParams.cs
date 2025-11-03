using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Office
{
    public class EditDivisionQueryParams
    {
        [Required] public long DivisionId { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string Acronym { get; set; } = string.Empty;
        [Required] public long OfficeId { get; set; }
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
