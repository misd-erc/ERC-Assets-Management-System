using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.OTP
{
    public class OTPValidationQueryParams
    {
        [Required] public long OTP { get; set; }
        [Required] public long SystemUserId { get; set; }
    }
}
