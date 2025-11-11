using System.ComponentModel.DataAnnotations;

namespace PortalDB.Models.QueryParams.Account
{
    public class EditSystemRoleQueryParams
    {
        [Required]
        public string? SessionKey { get; set; }

        [Required]
        public long ActionBySystemUserId { get; set; }

        public long SystemRoleId { get; set; } = 0; // 0 for new

        [Required]
        public string? SystemRoleName { get; set; }

        public string? SystemRoleDescription { get; set; }

        [Required]
        public bool SystemRoleIsActive { get; set; } = true;

        public List<SystemRoleScopeQueryParams>? SystemRoleScopes { get; set; }
    }

    public class SystemRoleScopeQueryParams
    {
        [Required]
        public long SystemModuleId { get; set; }

        [Required]
        public bool SystemRoleScopeIsActive { get; set; } = true;
    }
}
