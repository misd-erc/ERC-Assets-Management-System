using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.OTP
{
    public class ResendOTPQueryParams
    {
        [Required] public long SystemUserId { get; set; }
    }
}
