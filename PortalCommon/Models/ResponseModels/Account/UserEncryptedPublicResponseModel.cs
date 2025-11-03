using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.ResponseModels.Account
{
    public class UserEncryptedPublicResponseModel
    {
        public long SystemUserId { get; set; }
        public string SessionKey { get; set; } = string.Empty;
    }
}
