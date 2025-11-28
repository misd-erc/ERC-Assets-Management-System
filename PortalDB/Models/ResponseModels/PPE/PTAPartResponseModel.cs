using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.ParserModels.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PTA
{
    public class PTAPartResponseModel
    {
        public long? Id { get; set; }
        public long? PTAId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
