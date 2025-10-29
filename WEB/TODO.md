# TODO: Add Role Dropdown to User Edit Modal

## Steps to Complete

- [x] Add SystemRole interface to src/types/user/index.ts
- [x] Add getSystemRoles function to src/api/userApi.ts
- [x] Update UserEditModal.tsx to add roles state and fetch roles
- [x] Update UserEditModal.tsx to add roleId to formData and prefill logic
- [x] Update UserEditModal.tsx to add role dropdown in the form
- [x] Update UserEditModal.tsx to include systemRoleIdEncrypted in save payload
- [ ] Test the edit user functionality to ensure the role dropdown works and saves correctly
