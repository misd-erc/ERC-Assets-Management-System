using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Constants
{
    public static class EmailConstants
    {
        public static readonly string NO_REPLY_EMAIL = EnvironmentConstants.ERC_AMS_EMAIL_NO_REPLY;

        #region Subject
        public static readonly string SUBJECT_OTP_EMAIL = "Your AMS One-Time Password (OTP)";
        #endregion

        #region Template
        public static readonly string TEMPLATE_GENERAL_EMAIL = "GeneralEmailTemplate.cshtml";
        public static readonly string TEMPLATE_OTP_EMAIL = "OTPEmailTemplate.cshtml";
        #endregion
    }
}
