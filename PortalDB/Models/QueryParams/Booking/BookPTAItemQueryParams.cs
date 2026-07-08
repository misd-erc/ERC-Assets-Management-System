using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Booking
{
    public class BookPTAItemQueryParams
    {
        [Required] public long BookingItemId { get; set; }
        public string? PropertyNumber { get; set; }
        public long? CategoryId { get; set; }
        public long? LegendId { get; set; }
        public string? SerialNumber { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? Specification { get; set; } = string.Empty;
        public long? MeasurementUnitId { get; set; }
        public decimal? UnitCost { get; set; }

        // Optional initial custodian assignment - when provided, a TblPTAMovement is created alongside the TblPTA
        public long? PlantillaEmployeeId { get; set; }
        public long? NonPlantillaEmployeeId { get; set; }
        public long? ActualOfficeId { get; set; }
        public long? ActualDivisionId { get; set; }
        public DateTime? DateAssigned { get; set; }

        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
