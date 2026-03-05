using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.PTA
{
    public class PTAIssuanceListQueryParams
    {
        /// <summary>
        /// Filter by PTA group: "PPE" or "SE". Leave empty for all.
        /// </summary>
        public string? Group { get; set; }

        /// <summary>
        /// Search by employee name (plantilla or non-plantilla) or employee ID original.
        /// </summary>
        public string? SearchEmployee { get; set; }

        /// <summary>
        /// Filter/search by PAR/ICS number.
        /// - "PAR" → all PAR-prefixed numbers
        /// - "ICS" → all ICS-prefixed numbers
        /// - Any other value → partial match search
        /// </summary>
        public string? ParIcsFilter { get; set; }

        /// <summary>
        /// Filter by office ID.
        /// </summary>
        public long? OfficeId { get; set; }

        /// <summary>
        /// Filter by division ID.
        /// </summary>
        public long? DivisionId { get; set; }

        /// <summary>
        /// Filter movements assigned on or after this date.
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Filter movements assigned on or before this date.
        /// </summary>
        public DateTime? EndDate { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 50;

        [Required] public long ActionBySystemUserId { get; set; }

        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
