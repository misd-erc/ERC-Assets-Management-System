using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.Pagination
{
    public class PaginationGenericQueryParams
    {
        public string? SearchString { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }
        public long ActionBySystemUserIdEncrypted { get; set; }
    }
}
