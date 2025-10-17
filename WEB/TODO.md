# Integration of UsersController.cs Authentication Flow with Encryption

## Tasks
- [x] Install crypto-js library for AES encryption/decryption
- [x] Create src/utils/encryption.ts with encrypt/decrypt functions matching C# implementation
- [x] Update src/types/auth/index.ts to include new view model types (UserValidationViewModel, OTPValidationViewModel, etc.)
- [x] Update src/types/user/index.ts to include encrypted fields and new interfaces
- [x] Update src/api/authApi.ts to replace mock calls with real API calls to backend endpoints
- [x] Modify src/store/auth/index.ts to handle new authentication flow (MSAL login, OTP validation, session management)
- [x] Update src/components/auth/LoginScreen.tsx to use MSAL for Microsoft login and call user validation endpoint
- [x] Update src/components/auth/MFAVerification.tsx to call OTP validation endpoint
- [x] Add session token validation logic for app initialization and persistence
- [x] Test encryption/decryption functions to ensure compatibility with C# backend (tested via app startup)
- [x] Run the app and test full login flow (MSAL -> user validation -> OTP -> session)
- [x] Verify session persistence and token validation on app reload
