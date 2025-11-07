using PortalDB.Entities.DBO.Office;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Office
{
    public class VwDivisionResponseModel
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? Acronym { get; set; }
        public TblOffice? Office { get; set; }
        public bool? IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
