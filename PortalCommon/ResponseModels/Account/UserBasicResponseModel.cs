using PortalTools.Utilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.ResponseModels.Account
{
    public class UserBasicResponseModel
    {
        public long? Id { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public long? SystemRoleId { get; set; }
        public long? StatusId { get; set; }
        public long? OfficeId { get; set; }
        public long? DivisionId { get; set; }
        public bool IsActive { get; set; }
        public string? SystemRoleName { get; set; }
        public string? StatusName { get; set; }
        public string? OfficeName { get; set; }
        public string? OfficeAcronym { get; set; }
        public string? DivisionName { get; set; }
        public string? DivisionAcronym { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
}
