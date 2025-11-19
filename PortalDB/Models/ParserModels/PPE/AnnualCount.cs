using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ParserModels.PPE
{
    public class AnnualCount
    {
        public string DateAssigned { get; set; } = string.Empty;
        public string ParItrNumber { get; set; } = string.Empty;
        public string PlantillaEmployeeId { get; set; } = string.Empty;
        public string NonPlantillaEmployeeId { get; set; } = string.Empty;
        public string ActualOfficeAndDivision { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
    }
}
