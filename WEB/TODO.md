# Fix getUserPhoto() Issue in ProfileDropdown.tsx

## Tasks
- [ ] 1. Correct token key references in ProfileDropdown.tsx (change 'sessionKey' to 'sessionToken')
- [ ] 2. Remove all obsolete decrypt() calls (replace decrypt(stored) with stored, JSON.parse(decrypted) with JSON.parse(stored))
- [ ] 3. Update getUserPhoto() call to use correct parameters (change getUserPhoto(fileIdEncrypted, token) to getUserPhoto(fileId, systemUserId))
- [ ] 4. Clean early-return condition (remove 'if (!stored || !token) return;')
- [ ] 5. Add debug logs (add console.log for retrieving photo)
- [ ] 6. Verify getUserPhoto() implementation in userApi.ts (already correct)
- [ ] 7. Rebuild and test
