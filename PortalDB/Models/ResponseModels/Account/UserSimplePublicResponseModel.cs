using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Account
{
    public class UserSimplePublicResponseModel
    {
        public long SystemUserId { get; set; }
        public string SessionKey { get; set; } = string.Empty;
    }
}
