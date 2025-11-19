using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ViewModels.PPE
{
    public class PPEExcelViewModel
    {
        public string? PropertyNumber { get; set; }
        public string? Category { get; set; }
        public string? Legend { get; set; }
        public string? Description { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? SerialNumber { get; set; }
        public List<PPEPartExcelViewModel>? Parts { get; set; }
        public string? UnitOfMeasurement { get; set; }
        public string? UnitValue { get; set; }
        public DateTime? DateAcquired { get; set; }
        public List<PPEMovementExcelViewModel>? Movements { get; set; }


    }
}
