using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.QueryParams.OTP
{
    public class OTPValidationQueryParams
    {
        [Required] public string OTPEncrypted { get; set; } = string.Empty;
        [Required] public string SystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
