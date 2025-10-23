using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Universal
{
    public class SoloQueryParams
    {
        [Required] public string ActionBySystemUserIdEncrypted { get; set; }
    }
}
