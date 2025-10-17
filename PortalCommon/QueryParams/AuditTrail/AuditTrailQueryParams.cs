using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.AuditTrail
{
    public class AuditTrailQueryParams
    {
        public string? SearchString { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }
    }
}
