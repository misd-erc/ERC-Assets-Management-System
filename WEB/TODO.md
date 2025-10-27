# Update "Edit Profile" behavior — remove photo, replace phone with Employee ID, only allow first/last name editing

## Tasks
- [x] Update UserDetails interface to include employeeId?: string;
- [x] Remove avatar upload section from edit mode in MyProfile.tsx
- [x] Remove Phone Number field from the form entirely
- [x] Add Employee ID field to the form (editable)
- [x] Make only First Name and Last Name editable inputs, others read-only
- [x] Update formData state to include employeeId, remove phone, role, status, location
- [x] Modify handleEditProfile to initialize formData with firstName, lastName, employeeId
- [x] Update handleSave to create payload with only systemUserIdEncrypted, firstName, lastName, employeeIdEncrypted, actionBySystemUserIdEncrypted
- [x] Remove profileImageBase64 from save payload
- [x] Update localStorage userProfile with new firstName, lastName, employeeId
- [x] Adjust API call to match new payload structure (may need to modify authApi.ts)
- [x] Test edit functionality: switch to Details tab, show Save/Cancel, only first/last editable, no photo upload, no phone, employeeId present
- [x] Confirm backend key name for Employee ID and adjust if read-only
