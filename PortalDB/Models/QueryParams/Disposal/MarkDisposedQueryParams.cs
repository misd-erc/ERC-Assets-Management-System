using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Disposal
{
    public class MarkDisposedQueryParams
    {
        [Required] public DateTime DateDisposed { get; set; }
        public decimal? ProceedAmount { get; set; }
        public string? Buyer { get; set; }
        public string? Remarks { get; set; }
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
