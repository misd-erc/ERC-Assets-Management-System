using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Pagination
{
    public class PaginatedResponseModel<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        
        /// <summary>
        /// The "as of" date used for filtering results (if applicable)
        /// Shows assets acquired on or before this date
        /// </summary>
        public DateTime? AsOfDate { get; set; }
    }
}
