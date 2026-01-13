using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.PTA
{
    public class EditPTAMovementQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long PTAId { get; set; }
        [Required] public DateTime DateAssigned { get; set; }
        [Required] public string PtrItrNumber { get; set; } = string.Empty;
        [Required] public string ParIcsNumber { get; set; } = string.Empty;
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
