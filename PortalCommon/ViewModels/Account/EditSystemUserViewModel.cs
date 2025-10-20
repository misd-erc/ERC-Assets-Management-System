using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ViewModels.Account
{
    public class EditSystemUserViewModel
    {
        public long Id { get; set; }
        public long SystemRoleId { get; set; }
        public long StatusId { get; set; }
        public bool IsActive { get; set; }
        public long ActionBy { get; set; }

    }
}
