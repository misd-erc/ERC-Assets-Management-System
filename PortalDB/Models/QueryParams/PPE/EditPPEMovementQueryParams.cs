using PortalDB.Entities.ASSET.PPE;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.PPE;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.PPE
{
    public class EditPPEMovementQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long PPEId { get; set; }
        [Required] public DateTime DateAssigned { get; set; }
        [Required] public string ParItrNumber { get; set; } = string.Empty;
        [Required] public long PlantillaEmployeeId { get; set; }
        [Required] public long NonPlantillaEmployeeId { get; set; }
        [Required] public string Condition { get; set; } = string.Empty;
        [Required] public long ActualOfficeId { get; set; }
        [Required] public long ActualDivisionId { get; set; }
        [Required] public bool IsActive { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
