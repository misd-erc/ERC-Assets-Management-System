using PortalDB.Entities.ASSET.SE;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.SE
{
    public class SEMovementResponseModel
    {
        public long? Id { get; set; }
        public long? SEId { get; set; }
        public DateTime? DateAssigned { get; set; }
        public string ParItrNumber { get; set; } = string.Empty;
        public long? PlantillaEmployeeId { get; set; }
        public long? NonPlantillaEmployeeId { get; set; }
        public string PlantillaEmployeeIdOriginal { get; set; } = string.Empty;
        public string NonPlantillaEmployeeIdOriginal { get; set; } = string.Empty;
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public string Condition { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
