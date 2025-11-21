using PortalDB.Entities.ASSET.PPE;
using PortalDB.Models.ParserModels.PPE;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PPE
{
    public class PPEPartResponseModel
    {
        public long? Id { get; set; }
        public long? PPEId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
