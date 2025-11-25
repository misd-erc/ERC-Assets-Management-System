using PortalDB.Entities.ASSET.SE;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.SE
{
    public class SEResponseModel
    {
        public long? Id { get; set; }
        public string PropertyNumber { get; set; } = string.Empty;
        public TblSECategory? Category { get; set; }
        public TblSELegend? Legend { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public List<SEPartResponseModel>? Parts { get; set; }
        public string UnitOfMeasurement { get; set; } = string.Empty;
        public long? UnitValue { get; set; }
        public DateTime? DateAcquired { get; set; }
        public List<SEMovementResponseModel>? Movements { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
