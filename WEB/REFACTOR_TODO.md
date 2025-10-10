# Refactor TODO List

## Phase 1: Type Definitions & Stores
- [x] Refactor src/types/index.ts: Separate state interfaces from actions
- [x] Refactor src/store/auth.ts: Improve typing and error handling
- [x] Refactor src/store/data.ts: Add actions and better typing

## Phase 2: Custom Hooks
- [x] Create src/hooks/useAuth.ts
- [x] Create src/hooks/useData.ts
- [x] Update src/hooks/index.ts to export hooks

## Phase 3: Layout Components
- [x] Refactor src/components/layout/MainLayout.tsx: Fix imports, improve structure
- [x] Refactor src/components/layout/Sidebar.tsx: Optimize rendering, fix mobile
- [x] Refactor src/components/layout/TopBar.tsx: Fix naming, improve responsiveness

## Phase 4: Auth Components
- [x] Refactor src/components/auth/LoginScreen.tsx: Add form validation, improve UX
- [x] Refactor src/components/auth/MFAVerification.tsx: Optimize input handling

## Phase 5: Dashboard Components
- [x] Refactor src/pages/Dashboard.tsx: Integrate all components, add data fetching
- [x] Refactor src/components/dashboard/AssetOverviewChart.tsx: Optimize performance
- [x] Refactor src/components/dashboard/RecentActivitiesCard.tsx: Add real-time updates
- [x] Integrate PendingApprovalsCard and QuickActionsCard into Dashboard

## Phase 6: App & Lib
- [x] Refactor src/App.tsx: Add error boundary
- [x] Refactor src/lib/axios.ts: Improve interceptors

## Phase 7: Testing & Finalization
- [ ] Run TypeScript checks
- [ ] Test all components
- [ ] Verify UI matches Figma
