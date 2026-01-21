using PortalCommon.Utilities;
using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace PortalDB.Models.ResponseModels.Account
{
    public class EmployeeResponseModel
    {
        public long Id { get; set; }
        public TblSystemUser? SystemUser { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? SuffixName { get; set; }
        public string? EmployeeIdOriginal { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public TblEmploymentType? EmploymentType { get; set; }
        public TblPosition? Position { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }


}
