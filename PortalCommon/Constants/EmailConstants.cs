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
        public static readonly string SUBJECT_ACCOUNT_STATUS_UPDATE = "Account Status Update";
        public static readonly string SUBJECT_NEW_USER_JOINED = "Pending Account Approval – Action Required";
        #endregion

        #region Template
        public static readonly string TEMPLATE_GENERAL_EMAIL = "GeneralEmailTemplate.cshtml";
        public static readonly string TEMPLATE_OTP_EMAIL = "OTPEmailTemplate.cshtml";
        public static readonly string TEMPLATE_PENDING_USER_FOR_ADMIN_EMAIL = "PendingUserForAdminEmailTemplate.cshtml";
        #endregion

        #region Body
        public static readonly string BODY_PENDING_ACCOUNT_ADMIN_APPROVAL_REQUEST = "A new account approval request has been received from the user shown above. If this user is unauthorized, please suspend the account immediately.";
        public static readonly string BODY_PENDING_ACCOUNT = "Your account is still awaiting approval. You will receive an email once the administrator has reviewed and approved (or rejected) your request.";
        public static readonly string BODY_INACTIVE_ACCOUNT = "Your account has been deactivated by the Administrator. Access to ERC-AMS is currently suspended. Please contact the Administrator to request reactivation.";
        public static readonly string BODY_SUSPENDED_ACCOUNT = "Your account has been suspended by the Administrator. Access to ERC-AMS is temporarily restricted. Please contact the Administrator to resolve this matter.";
        public static readonly string BODY_ACTIVE_ACCOUNT = "Your account has been activated by the Administrator. You now have access to ERC-AMS.";
        #endregion
    }
}
