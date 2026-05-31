using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.AssetRequest
{
    public class CreateAssetRequestItemQueryParams
    {
        public long? PTAId { get; set; }

        [Required]
        public string PropertyNumber { get; set; } = string.Empty;

        [Required]
        public string Remarks { get; set; } = string.Empty;
    }

    public class CreateAssetRequestQueryParams
    {
        [Required]
        public long AssignedCommitteeSystemUserId { get; set; }

        [Required]
        [MinLength(1)]
        public List<CreateAssetRequestItemQueryParams> Items { get; set; } = new();

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }
}
