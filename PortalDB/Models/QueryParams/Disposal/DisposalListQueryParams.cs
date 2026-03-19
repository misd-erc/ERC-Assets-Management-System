using PortalDB.Models.QueryParams.Pagination;

namespace PortalDB.Models.QueryParams.Disposal
{
    public class DisposalListQueryParams : PaginationGenericQueryParams
    {
        public string? GroupName { get; set; }
        public string? Status { get; set; }
    }
}
