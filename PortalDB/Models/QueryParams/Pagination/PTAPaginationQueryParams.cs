using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace PortalDB.Models.QueryParams.Pagination
{
    public class PTAPaginationQueryParams
    {
        public string? SearchString { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 100;

        public DateTime? StartDate { get; set; }

        public long? FiscalYear { get; set; }
        public DateTime? EndDate { get; set; }
        public long? CategoryId { get; set; }
        public long? EmployeeId { get; set; }
        [Required] public string? GroupName { get; set; }
        public string? GroupBy { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
