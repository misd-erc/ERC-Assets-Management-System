using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Office
{
    public class OfficeResponseModel
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? GeneralCode { get; set; }
        public string? Acronym { get; set; }
        public bool? IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
