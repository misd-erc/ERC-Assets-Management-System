# TODO: Make Sidebar Dynamic Based on localStorage userDetails

## Tasks
- [ ] Modify Sidebar.tsx to read 'userDetails' from localStorage
- [ ] Decrypt the localStorage value using decrypt function
- [ ] Parse the decrypted string as JSON
- [ ] Extract userScopes and isAdmin from the parsed userDetails
- [ ] Update filtering logic to use extracted scopes
- [ ] Test the sidebar filtering with provided JSON data
- [ ] Ensure admin items are shown for administrators
