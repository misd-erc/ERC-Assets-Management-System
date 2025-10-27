using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Models.QueryParams.Uploader
{
    public class FileUploaderQueryParams
    {
        [Required] public string ActionBySystemUserIdEncrypted { get; set; }
    }
}
