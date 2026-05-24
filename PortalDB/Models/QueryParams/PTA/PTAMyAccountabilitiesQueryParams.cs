using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.PTA
{
    public class PTAMyAccountabilitiesQueryParams
    {
        /// <summary>
        /// Employee ID original value (string) from user profile.
        /// If provided, this is used as the primary filter for accountabilities.
        /// </summary>
        public string? EmployeeId { get; set; }

        /// <summary>
        /// Optional filter by item group: PPE or SE.
        /// </summary>
        public string? Group { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 50;

        [Required]
        public long ActionBySystemUserId { get; set; }

        [Required]
        public string SessionKey { get; set; } = string.Empty;
    }
}
