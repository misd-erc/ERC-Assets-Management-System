using System;
using System.ComponentModel.DataAnnotations;

namespace PortalCommon.Models.QueryParams.Account
{
    public class UserValidationQueryParams
    {
        [Required] public string EntraIdEncrypted { get; set; } = string.Empty;
        [Required] public string FirstNameEncrypted { get; set; } = string.Empty;
        [Required] public string LastNameEncrypted { get; set; } = string.Empty;
        [Required] public string EmailEncrypted { get; set; } = string.Empty;
        public string? EmployeeIdEncrypted { get; set; } = string.Empty;
    }
}
