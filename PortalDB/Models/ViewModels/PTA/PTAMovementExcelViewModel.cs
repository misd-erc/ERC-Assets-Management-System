using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ViewModels.PTA
{
    public class PTAMovementExcelViewModel
    {
        public DateTime? Date { get; set; }
        public string? PTRITRNumber { get; set; }
        public string? PARICSNumber { get; set; }
        public string? PlantillaEmployeeId { get; set; }
        public string? NonPlantillaEmployeeId { get; set; }
        public string? ActualDivision { get; set; }
        public string? Condition { get; set; }

    }
}

