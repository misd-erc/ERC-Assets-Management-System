using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ViewModels.SMTP
{
    public class EmailViewModel
    {
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public bool IsHTML { get; set; } = true;
    }
}
