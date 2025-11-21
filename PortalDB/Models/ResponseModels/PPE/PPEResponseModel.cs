using PortalDB.Entities.ASSET.PPE;
using PortalDB.Models.ParserModels.PPE;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PPE
{
    public class PPEResponseModel
    {
        public long? Id { get; set; }
        public string PropertyNumber { get; set; } = string.Empty;
        public TblPPECategory? Category { get; set; }
        public TblPPELegend? Legend { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public List<PPEPartResponseModel>? Parts { get; set; }
        public string UnitOfMeasurement { get; set; } = string.Empty;
        public long? UnitValue { get; set; }
        public DateTime? DateAcquired { get; set; }
        public List<PPEMovementResponseModel>? Movements { get; set; }
        public long? EstimatedUsefulLife { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
