using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Report
{
    public class CreateReportSerialParams
    {
        [Required] public string ReportName { get; set; } = string.Empty;
        [Required] public string SerialNumber { get; set; } = string.Empty;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
