using PortalDB.Entities.ASSET.PPE;
using PortalDB.Models.ResponseModels.PPE;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.PPE
{
    public class EditPPEPartQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long PPEId { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string SerialNumber { get; set; } = string.Empty;
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
