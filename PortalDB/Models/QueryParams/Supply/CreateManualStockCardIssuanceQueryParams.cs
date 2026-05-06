using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Supply
{
    public class CreateManualStockCardIssuanceQueryParams
    {
        [Required] public string StockNumber { get; set; } = string.Empty;
        [Required] public string Description { get; set; } = string.Empty;
        [Required] public List<CreateManualStockCardIssuanceEntryQueryParams> Entries { get; set; } = new();
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }

    public class CreateManualStockCardIssuanceEntryQueryParams
    {
        [Required] public long UnitId { get; set; }
        [Required] public long IssueQuantity { get; set; }
        public string? ItemRemarks { get; set; }
    }
}
