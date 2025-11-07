using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Module;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Account
{
    public class SystemRoleScopeResponseModel
    {
        public long? Id { get; set; }
        //public TblSystemRole? Role { get; set; }
        public TblSystemModule? Module { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDeleted { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
