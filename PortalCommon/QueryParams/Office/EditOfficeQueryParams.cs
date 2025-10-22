using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.Office
{
    public class EditOfficeQueryParams
    {
        [Required] public string OfficeIdEncrypted { get; set; } = string.Empty;
        [Required] public string NameEncrypted { get; set; } = string.Empty;
        [Required] public string AcronymEncrypted { get; set; } = string.Empty;
        [Required] public string ActionBySystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
