# TODO: Implement Edit Role Fetch Functionality

## Tasks
- [x] Modify `onEditRole` in `RolesManagement.tsx` to fetch role details using `getSystemRoleById`
- [x] Map the API response to the `Role` type, ensuring `assignedPermissions` are correctly derived from `scope`
- [x] Handle loading and error states for the fetch operation
- [x] Fix permission mapping to use scope IDs correctly (scope IDs start from 15, map to permission array index)
- [x] Make the edit modal wider (changed max-w-4xl to max-w-6xl)
- [ ] Test the edit functionality to verify API call and data population

## Files to Edit
- `src/pages/RolesManagement.tsx`

## Followup Steps
- [ ] Run the application and test clicking edit on a role
- [ ] Verify that the API call is made and the dialog populates with accurate scope data
- [ ] Check for any console errors or issues
