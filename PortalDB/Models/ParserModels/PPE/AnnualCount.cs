using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ParserModels.PPE
{
    public class AnnualCount
    {
        public int Year { get; set; }
        public string Date { get; set; } = string.Empty;
        public string ParItrNumber { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
    }
}
