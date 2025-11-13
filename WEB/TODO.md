# TODO: Update Role Management Module List

## Completed Tasks
- [x] Updated PERMISSION_CATEGORIES in permissions.ts to match SystemModule list (IDs 1-18, names without acronyms)
- [x] Updated role conversion logic in RolesManagement.tsx to use scope.id directly as permission ID
- [x] Updated handleAddRole and handleEditRole functions to send systemModuleId directly from permission strings

## Pending Tasks
- [ ] Test the role creation and editing functionality to ensure permissions are correctly mapped
- [ ] Verify that the API receives the correct systemModuleId values (1-18)
- [ ] Check that the RoleDialog modal displays the updated module names correctly
- [ ] Ensure existing roles display their permissions correctly with the new mapping

## Notes
- The permission IDs in PERMISSION_CATEGORIES now correspond directly to systemModuleId (1-18)
- Module names have been updated to remove acronyms (e.g., "Delivery & Receipt of Items" instead of "Delivery & Receipt")
- The conversion logic now uses parseInt(permission) to send the correct module IDs to the API
