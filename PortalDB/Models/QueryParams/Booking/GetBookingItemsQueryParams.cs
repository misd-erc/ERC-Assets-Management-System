using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Booking
{
    public class GetBookingItemsQueryParams
    {
        [Required] public string Group { get; set; } = string.Empty;
        public string? Status { get; set; } = "Pending";
        public string? SearchString { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 9999; //temporary only
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
