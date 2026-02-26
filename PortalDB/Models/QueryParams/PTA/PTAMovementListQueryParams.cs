using System;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.PTA
{
    public class PTAMovementListQueryParams
    {
        public long? PTAId { get; set; }

        /// <summary>
        /// Filter for PTR/ITR Number. Can be:
        /// - "PTR" to get all movements with PTR prefix
        /// - "ITR" to get all movements with ITR prefix
        /// - Or a specific number/value to search for
        /// </summary>
        public string? PtrItrFilter { get; set; }

        /// <summary>
        /// Filter for PAR/ICS Number. Can be:
        /// - "PAR" to get all movements with PAR prefix
        /// - "ICS" to get all movements with ICS prefix
        /// - Or a specific number/value to search for
        /// </summary>
        public string? ParIcsFilter { get; set; }

        /// <summary>
        /// Filter for RRPPE/RRSP Number. Can be:
        /// - "RRPPE" to get all movements with RRPPE prefix (PPE returns)
        /// - "RRSP" to get all movements with RRSP prefix (SE returns)
        /// - Or a specific number/value to search for
        /// </summary>
        public string? RrppeRrspFilter { get; set; }

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 100;

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [Required] public long ActionBySystemUserId { get; set; }

        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
