using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ViewModels.OTP
{
    public class OTPValidationViewModel
    {
        public string OTP { get; set; } = string.Empty;
        public string SystemUserId { get; set; } = string.Empty;
    }
}
