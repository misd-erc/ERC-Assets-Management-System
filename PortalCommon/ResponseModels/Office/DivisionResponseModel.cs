using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ResponseModels.Office
{
    public class DivisionResponseModel
    {
        public long? Id { get; set; }
        public string? Name { get; set; }
        public string? Acronym { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
