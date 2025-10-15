using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ViewModels.OTP
{
    public class OTPValidationViewModel
    {
        public string OTPEncrypted { get; set; } = string.Empty;
        public string SystemUserIdEncrypted { get; set; } = string.Empty;
    }
}
