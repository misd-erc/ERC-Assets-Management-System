using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Models.ResponseModels.PTA;
using System;
using System.Collections.Generic;
using System.Text;

namespace PortalDB.Models.ResponseModels.PPE
{
    public class PTAGroupedByEmployeeResponseModel
    {
        public long? EmployeeId { get; set; }
        public long? SystemUserId { get; set; }
        public string? EmployeeIdOriginal { get; set; }
        public string? FullName { get; set; }
        public TblPosition? Position { get; set; }
        public TblEmploymentType? EmploymentType { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public List<PTAResponseModel>? PTA { get; set; }
    }
}
