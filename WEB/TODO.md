<<<<<<< HEAD
# TODO: Make Sidebar Dynamic Based on localStorage userDetails

## Tasks
- [ ] Modify Sidebar.tsx to read 'userDetails' from localStorage
- [ ] Decrypt the localStorage value using decrypt function
- [ ] Parse the decrypted string as JSON
- [ ] Extract userScopes and isAdmin from the parsed userDetails
- [ ] Update filtering logic to use extracted scopes
- [ ] Test the sidebar filtering with provided JSON data
- [ ] Ensure admin items are shown for administrators
=======
# Update Roles Management to New API Response

## Tasks
- [x] Update `src/types/roles.ts` to match new API response structure
- [x] Update `src/api/roles/rolesApi.ts` to reflect new response model
- [x] Update `src/components/roles-management/RolesTable.tsx` to use new fields
- [x] Update `src/components/roles-management/RoleDialog.tsx` to use `scope` instead of `assignedPermissions`
- [x] Fix TypeScript errors in other files (UserFormModal, auth store)
- [x] Implement auto-selection of permissions in RoleDialog based on API scope data
>>>>>>> eb94c43 (fixed issue in Role Management)
