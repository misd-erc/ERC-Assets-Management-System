using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.PTA
{
    public class EditRPCPPESignatoryTemplateQueryParams
    {
        [Required] public long Id { get; set; }
        [Required] public string Name { get; set; } = string.Empty;
        [Required] public string SignatoryDataJson { get; set; } = string.Empty;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
