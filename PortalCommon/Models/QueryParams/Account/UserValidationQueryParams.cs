using System;
using System.ComponentModel.DataAnnotations;

namespace PortalCommon.Models.QueryParams.Account
{
    public class UserValidationQueryParams
    {
        [Required] public long EntraId { get; set; }
        [Required] public string FirstName { get; set; } = string.Empty;
        [Required] public string LastName { get; set; } = string.Empty;
        [Required] public string Email { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
    }
}
