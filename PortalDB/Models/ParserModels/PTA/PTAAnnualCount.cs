using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ParserModels.PTA
{
    public class PTAAnnualCount
    {
        public DateTime? DateAssigned { get; set; }
        public string PtrItrNumber { get; set; } = string.Empty;
        public string ParIcsNumber { get; set; } = string.Empty;
        public string PlantillaEmployeeId { get; set; } = string.Empty;
        public string PlantillaFirstname { get; set; } = string.Empty;
        public string PlantillaLastname { get; set; } = string.Empty;
        public string PlantillaPosition { get; set; } = string.Empty;
        public string NonPlantillaEmployeeId { get; set; } = string.Empty;
        public string NonPlantillaFirstname { get; set; } = string.Empty;
        public string NonPlantillaLastname { get; set; } = string.Empty;
        public string NonPlantillaPosition { get; set; } = string.Empty;
        public string ActualOfficeAndDivision { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public string? Status { get; set; }
    }
}
