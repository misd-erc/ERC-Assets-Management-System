import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { MFAVerification } from '@/components/auth/MFAVerification';
import MainLayout from '@/components/layout/MainLayout';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { isSessionValid, isSessionExpired, handleSessionExpired } from '@/utils/sessionUtils';
import { NoRolePage, UnderConstructionPage } from '@/pages';
import AssetInfoPage from '@/pages/AssetInfoPage';
import EmployeePortalPage from '@/pages/EmployeePortalPage';
import { initUserSync } from '@/utils/userSync';

import { decrypt } from '@/utils/encryption';
import { secureStorage } from './utils/secureStorage';


// Helper: Returns the route the current user should land on after auth
function getRoleBasedRedirect(): string {
  try {
    const raw = secureStorage.getItem('userDetails');
    if (!raw) return '/dashboard';
    const d = JSON.parse(decrypt(raw));
    const role = Array.isArray(d.systemRole) ? d.systemRole[0]?.roleName : d.systemRole?.roleName;
    return (role as string | undefined)?.toLowerCase() === 'employee' ? '/employee-portal' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { requireMFA } = useAuthStore();
  const hasValidSession = isSessionValid();
  const isExpired = isSessionExpired();

  // If session is expired, handle expiration and redirect
  if (isExpired) {
    handleSessionExpired('Your session has expired. Please log in again.');
    return <Navigate to="/" replace />;
  }

  // If no valid session token, redirect to login
  if (!hasValidSession) {
    return <Navigate to="/" replace />;
  }

  // If MFA is required, redirect to MFA page
  if (requireMFA) {
    return <Navigate to="/mfa" replace />;
  }

  // Check user role access
  const encryptedUserDetails = secureStorage.getItem('userDetails');
  if (encryptedUserDetails) {
    try {
      const userDetails = JSON.parse(decrypt(encryptedUserDetails));
      const systemRole = userDetails.systemRole;
      const systemRoleId = Array.isArray(systemRole) ? systemRole[0]?.id : systemRole?.id;
      const isActive = userDetails.systemUserStatus?.name;

      if (systemRoleId == 0 || systemRoleId == null || isActive !== "Active") {
        return <Navigate to="/no-role" replace />;
      }
    } catch (error) {
      return <Navigate to="/no-role" replace />;
    }
  }

  // Session is valid, user has role and is active, allow access
  return <>{children}</>;
}

// Employee-only Route — grants access to /employee-portal for EMPLOYEE role users
function EmployeeRoute({ children }: { children: React.ReactNode }) {
  const { requireMFA } = useAuthStore();
  const hasValidSession = isSessionValid();
  const isExpired = isSessionExpired();

  if (isExpired) {
    handleSessionExpired('Your session has expired. Please log in again.');
    return <Navigate to="/" replace />;
  }

  if (!hasValidSession) {
    return <Navigate to="/" replace />;
  }

  if (requireMFA) {
    return <Navigate to="/mfa" replace />;
  }

  // Verify the user actually holds the Employee role
  try {
    const raw = secureStorage.getItem('userDetails');
    if (raw) {
      const d = JSON.parse(decrypt(raw));
      const role = Array.isArray(d.systemRole) ? d.systemRole[0]?.roleName : d.systemRole?.roleName;
      if ((role as string | undefined)?.toLowerCase() !== 'employee') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, requireMFA, initialize } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    initialize();
    initUserSync();
  }, [initialize]);

  // Sync session IDs on every page load
  useEffect(() => {
    import('./utils/sessionUtils').then(({ syncSessionIds }) => {
      syncSessionIds();
    });
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={!isAuthenticated ? <LoginScreen /> : <Navigate to={getRoleBasedRedirect()} replace />}
      />
      
      {/* Public asset info — accessible without login (e.g. scanning a QR sticker) */}
      <Route path="/asset-info/:id" element={<AssetInfoPage />} />

      {/* MFA Route */}
      <Route
        path="/mfa"
        element={requireMFA ? <MFAVerification /> : <Navigate to={getRoleBasedRedirect()} replace />}
      />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
          <Route path="dashboard" element={<div />} />
          <Route path="profile" element={<div />} />
          <Route path="under-construction" element={<div />} />
          <Route path="disposals" element={<div />} />

        </Route>
        
        {/* No Role Route */}
        <Route path="/no-role" element={<NoRolePage />} />

      {/* Employee Portal Route */}
      <Route
        path="/employee-portal"
        element={
          <EmployeeRoute>
            <EmployeePortalPage />
          </EmployeeRoute>
        }
      />

      {/* Under Construction Route */}
      <Route
        path="/under-construction"
        element={
          <ProtectedRoute>
            <UnderConstructionPage />
          </ProtectedRoute>
        }
      />

      {/* UC Route */}
      <Route
        path="/uc"
        element={
          <ProtectedRoute>
            <UnderConstructionPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      {/* <ErrorBoundary> */}
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <div className="min-h-screen bg-background">
            <AppContent />
          </div>
        </Suspense>
        <Toaster />
      {/* </ErrorBoundary> */}
    </Router>
  );
}
