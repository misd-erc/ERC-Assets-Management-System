using PortalDB.Entities.DBO.Account;

namespace PortalDB.Models.ViewModels.Account
{
    public class EditSystemRoleViewModel
    {
        public long Id { get; set; } = 0; // 0 for new

        public string? RoleName { get; set; }

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public List<EditSystemRoleScopeViewModel>? Scopes { get; set; }

        public long ActionBySystemUserId { get; set; }
    }

    public class EditSystemRoleScopeViewModel
    {
        public long ModuleId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
