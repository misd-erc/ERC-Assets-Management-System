using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.PTA
{
    public class EditPTAPartQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long PTAId { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string SerialNumber { get; set; } = string.Empty;
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
