using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.ViewModels.Account
{
    public class EditSystemUserProfilePictureViewModel
    {
        public long SystemUserId { get; set; }
        public long FileStorageId { get; set; }
    }
}
