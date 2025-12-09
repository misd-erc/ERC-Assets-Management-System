using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.QueryParams.PTA
{
    public class EditPTACategoryQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string GeneralCode { get; set; } = string.Empty;
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
