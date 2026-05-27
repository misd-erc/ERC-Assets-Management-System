using PortalDB.Models.QueryParams.Pagination;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.AssetRequest
{
    public class AssetRequestListQueryParams : PaginationGenericQueryParams
    {
        public string? Status { get; set; }

        public long? AssignedCommitteeSystemUserId { get; set; }

        public long? AssignedPersonnelSystemUserId { get; set; }

        public bool MineOnly { get; set; } = false;
    }

    public class AssetRequestLookupQueryParams
    {
        [Required]
        public string PropertyNumber { get; set; } = string.Empty;

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }
}
