using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ViewModels.AuditTrail
{
    public class ChangeDetail
    {
        public string? Old { get; set; }
        public string? New { get; set; }
    }
}
