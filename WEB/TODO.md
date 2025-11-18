# Update Roles Management to New API Response

## Tasks
- [x] Update `src/types/roles.ts` to match new API response structure
- [x] Update `src/api/roles/rolesApi.ts` to reflect new response model
- [x] Update `src/components/roles-management/RolesTable.tsx` to use new fields
- [x] Update `src/components/roles-management/RoleDialog.tsx` to use `scope` instead of `assignedPermissions`
- [x] Fix TypeScript errors in other files (UserFormModal, auth store)
- [x] Implement auto-selection of permissions in RoleDialog based on API scope data
