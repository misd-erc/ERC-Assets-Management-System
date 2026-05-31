using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.AssetRequest
{
    public class AssignAssetRequestQueryParams
    {
        [Required]
        public long RequestId { get; set; }

        public long? AssignedCommitteeSystemUserId { get; set; }

        public long? AssignedPersonnelSystemUserId { get; set; }

        public string? Remarks { get; set; }

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }

    public class UpdateAssetRequestStatusQueryParams
    {
        [Required]
        public long RequestId { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }

    public class AddAssetRequestHistoryQueryParams
    {
        [Required]
        public long RequestId { get; set; }

        [Required]
        public string Remarks { get; set; } = string.Empty;

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }

    public class AddAssetRequestItemQueryParams
    {
        [Required]
        public long RequestId { get; set; }

        public long? PTAId { get; set; }

        [Required]
        public string PropertyNumber { get; set; } = string.Empty;

        [Required]
        public string Remarks { get; set; } = string.Empty;

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }
}
