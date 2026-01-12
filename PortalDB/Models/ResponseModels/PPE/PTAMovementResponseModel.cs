using PortalDB.Entities.ASSET.PTA;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.Account;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PTA
{
    public class PTAMovementResponseModel
    {
        public long? Id { get; set; }
        public long? PTAId { get; set; }
        public DateTime? DateAssigned { get; set; }
        public string ParItrNumber { get; set; } = string.Empty;
        public long? PlantillaEmployeeId { get; set; }
        public long? NonPlantillaEmployeeId { get; set; }
        public string PlantillaEmployeeIdOriginal { get; set; } = string.Empty;
        public string NonPlantillaEmployeeIdOriginal { get; set; } = string.Empty;
        public List<EmployeeResponseModel>? Employee { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public string Condition { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
