using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ViewModels.PPE
{
    public class PPEMovementExcelViewModel
    {
        public DateTime? Date { get; set; }
        public string? PARITRNumber { get; set; }
        public string? PlantillaEmployeeId { get; set; }
        public string? NonPlantillaEmployeeId { get; set; }
        public string? ActualDivision { get; set; }
        public string? Condition { get; set; }

    }
}

