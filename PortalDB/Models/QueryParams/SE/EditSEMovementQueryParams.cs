using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.SE
{
    public class EditSEMovementQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public long SEId { get; set; }
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
