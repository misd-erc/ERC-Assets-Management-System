using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalDB.Models.QueryParams.Account
{
    public class EditEmployeeQueryParams
    {
        public long? EmployeeId { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? SuffixName { get; set; }
        [Required] public string? EmployeeIdOriginal { get; set; }
        public string? OfficeName { get; set; }
        public string? DivisionName { get; set; }
        public string? EmploymentTypeName { get; set; }
        public string? PositionName { get; set; }
        public bool IsActive { get; set; } = true;
        public long ActionBySystemUserId { get; set; }
        public string SessionKey { get; set; } = string.Empty;
    }
}
