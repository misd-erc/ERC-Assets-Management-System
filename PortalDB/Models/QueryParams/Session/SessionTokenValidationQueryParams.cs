using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.Session
{
    public class SessionTokenValidationQueryParams
    {
        [Required] public long SystemUserId { get; set; }
        [Required] public string Key { get; set; } = string.Empty;
    }
}
