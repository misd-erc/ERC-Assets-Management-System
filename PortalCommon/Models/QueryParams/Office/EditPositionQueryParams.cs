using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Office
{
    public class EditPositionQueryParams
    {
        [Required] public string PositionIdEncrypted { get; set; } = string.Empty;
        [Required] public string NameEncrypted { get; set; } = string.Empty;
        [Required] public string AcronymEncrypted { get; set; } = string.Empty;
        [Required] public string SalaraGradeEncrypted { get; set; } = string.Empty;
        [Required] public string IsActiveEncrypted { get; set; } = string.Empty;
        [Required] public string ActionBySystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
