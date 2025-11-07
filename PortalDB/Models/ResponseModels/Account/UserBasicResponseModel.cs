using PortalDB.Entities.DBO.Account;
using PortalDB.Entities.DBO.Office;
using PortalDB.Entities.DBO.Office.Division;
using PortalDB.Entities.DBO.Storage;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.ResponseModels.Account
{
    public class UserBasicResponseModel
    {
        public long? Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? EmployeeId { get; set; }
        public bool IsActive { get; set; }
        public TblSystemRole? SystemRole { get; set; }
        public TblSystemUserStatus? SystemUserStatus { get; set; }
        public TblOffice? Office { get; set; }
        public TblDivision? Division { get; set; }
        public TblFileStorage? ProfilePictureStorageFile { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
}
