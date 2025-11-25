using PortalDB.Entities.ASSET.SE;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.SE
{
    public class SEPartResponseModel
    {
        public long? Id { get; set; }
        public long? SEId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
