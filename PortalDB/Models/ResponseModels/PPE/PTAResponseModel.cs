using PortalDB.Entities.ASSET.PTA;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PTA
{
    public class PTAResponseModel
    {
        public long? Id { get; set; }
        public string Group { get; set; } = string.Empty;
        public string PropertyNumber { get; set; } = string.Empty;
        public TblPTACategory? Category { get; set; }
        public TblPTALegend? Legend { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public List<PTAPartResponseModel>? Parts { get; set; }
        public string UnitOfMeasurement { get; set; } = string.Empty;
        public long? UnitValue { get; set; }
        public DateTime? DateAcquired { get; set; }
        public List<PTAMovementResponseModel>? Movements { get; set; }
        public long? EstimatedUsefulLife { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
