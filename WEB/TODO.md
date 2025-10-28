# TODO: Update My Profile Page Layout and Integrations

## Tasks
- [x] Update src/api/auditApi.ts: Add getActivities and getAuditTrail API functions
- [x] Update src/components/profile/MyProfile.tsx: Add local states for activityLogs, activityLoading, activityPage, activityTotalPages
- [x] Update src/components/profile/MyProfile.tsx: Update useEffect to fetch data for Activity and Audit Trail tabs
- [x] Update src/components/profile/MyProfile.tsx: Modify Activity tab content to use table with columns: Action | Action By | Date
- [x] Update src/components/profile/MyProfile.tsx: Add pagination footer for Activity tab (Prev/Next buttons and "Page {x} of {y}")
- [x] Update src/components/profile/MyProfile.tsx: Update fetch functions to use new API functions with Axios
- [x] Update src/components/profile/MyProfile.tsx: Handle loading states, errors, and empty states
- [x] Update src/components/profile/MyProfile.tsx: Ensure date formatting and UI consistency
- [ ] Test API integrations and verify functionality
