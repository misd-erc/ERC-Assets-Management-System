# TODO: Remove Encrypted Fields from Auth API

## Tasks
- [x] Update src/types/auth/index.ts: Rename UserEncryptedPublicViewModel to UserPublicViewModel and remove "Encrypted" from field names
- [x] Update src/api/authApi.ts: Change all function parameters, variables, localStorage keys, and API calls to use plain names (remove "Encrypted" suffix)
- [x] Update src/store/auth/index.ts: Fix references to systemUserIdEncrypted
- [x] Verify changes compile and no references are broken
