using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Disposal
{
    public class EditDisposalQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string Group { get; set; } = string.Empty;
        [Required] public string Reason { get; set; } = string.Empty;
        [Required] public string Method { get; set; } = string.Empty;
        [Required] public List<long> PTAIds { get; set; } = new();
        public string? Buyer { get; set; }
        public string? Remarks { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
