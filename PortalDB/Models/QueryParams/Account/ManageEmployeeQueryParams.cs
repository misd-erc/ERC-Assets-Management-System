using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Account
{
    public class ManageEmployeeQueryParams
    {
        public long EmployeeId { get; set; } = 0;
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? SuffixName { get; set; }
        [Required] public string EmployeeIdOriginal { get; set; } = string.Empty;
        public long? OfficeId { get; set; }
        public long? DivisionId { get; set; }
        public long? EmploymentTypeId { get; set; }
        public long? PositionId { get; set; }
        public bool IsActive { get; set; } = true;
        [Required] public long ActionBySystemUserId { get; set; }
        [Required] public string SessionKey { get; set; } = string.Empty;
    }
}
