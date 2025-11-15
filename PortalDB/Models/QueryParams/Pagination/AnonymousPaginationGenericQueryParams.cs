using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.Pagination
{
    public class AnonymousPaginationGenericQueryParams
    {
        public string? SearchString { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 100;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }
    }
}
