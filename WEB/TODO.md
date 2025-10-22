# TODO: Implement User Details Fetching and Storage

## Tasks
- [x] Update UserDetails interface in authApi.ts to match API response (lowercase fields)
- [x] Import getUserDetails in auth store
- [x] Modify verifyMFA in auth store to call getUserDetails after OTP validation and store in localStorage
- [x] Modify initialize in auth store to check and fetch userDetails if missing
- [x] Modify logout in auth store to clear userDetails from localStorage
- [x] Update TopBar.tsx to read user name from localStorage.userDetails instead of auth store
- [x] Update ProfileDropdown.tsx to read user name from localStorage.userDetails
