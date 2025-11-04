# Session Expiration Fix on Page Refresh

## Problem
On page refresh, the app only checks for token presence but not expiration. Users with expired sessions are not redirected to login immediately.

## Solution
Modify ProtectedRoute component to check session expiration and redirect if expired.

## Tasks
- [x] Add utility function to check if session is expired
- [x] Modify ProtectedRoute component to check expiration
- [ ] Test the fix
