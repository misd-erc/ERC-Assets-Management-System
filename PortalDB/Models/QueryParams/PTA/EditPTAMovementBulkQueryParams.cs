using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.PTA
{
    public class MovementItemParams
    {
        [Required] public long Id { get; set; }
        [Required] public long PTAId { get; set; }
        [Required] public DateTime DateAssigned { get; set; }
        public string PtrItrNumber { get; set; } = string.Empty;
        public string ParIcsNumber { get; set; } = string.Empty;
        public string RrppeRrspNumber { get; set; } = string.Empty;
        public string? Status { get; set; }
        public long? PlantillaEmployeeId { get; set; }
        public long? NonPlantillaEmployeeId { get; set; }
        public string Condition { get; set; } = string.Empty;
        public long? ActualOfficeId { get; set; }
        public long? ActualDivisionId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsCurrent { get; set; } = false;
    }

    public class EditPTAMovementBulkQueryParams
    {
        [Required] public List<MovementItemParams> Movements { get; set; } = new();
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
