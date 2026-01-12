using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ParserModels.PTA
{
    public class PTAItem
    {
        public string PropertyNumber { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Legend { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public List<PTAPart>? Parts { get; set; }
        public string UnitOfMeasurement { get; set; } = string.Empty;
        public long? UnitValue { get; set; }
        public DateTime? DateAssigned { get; set; }
        public List<PTAAnnualCount>? AnnualCount { get; set; }
        public long? EstimatedUsefulLife { get; set; }
        public DateTime? FiscalDate { get; set; }
    }
}
