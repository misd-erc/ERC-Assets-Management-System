using PortalDB.Entities.DBO.Account;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Account
{
    public class SystemRoleResponseModel
    {
        public long? Id { get; set; }
        public string? RoleName { get; set; }
        public string? Description { get; set; }
        public List<SystemRoleScopeResponseModel>? Scope { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UserCount { get; set; }

    }
}
