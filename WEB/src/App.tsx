import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { LoginScreen } from './components/auth/LoginScreen';
import { MFAVerification } from './components/auth/MFAVerification';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isSessionValid, isSessionExpired, handleSessionExpired } from './utils/sessionUtils';
import { NoRolePage, UnderConstructionPage } from './pages';
import { decrypt } from './utils/encryption';

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
  const encryptedUserDetails = localStorage.getItem('userDetails');
  if (encryptedUserDetails) {
    try {
      const userDetails = JSON.parse(decrypt(encryptedUserDetails));
      const systemRole = userDetails.systemRole;
      const systemRoleId = Array.isArray(systemRole) ? systemRole[0]?.id : systemRole?.id;
      const isActive = userDetails.systemUserStatus?.name;

      if (systemRoleId == 0 || systemRoleId == null) {
        return <Navigate to="/no-role" replace />;
      }
    } catch (error) {
      return <Navigate to="/no-role" replace />;
    }
  }

  // Session is valid, user has role and is active, allow access
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, requireMFA, initialize } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    initialize();
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
        element={!isAuthenticated ? <LoginScreen /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* MFA Route */}
      <Route 
        path="/mfa" 
        element={requireMFA ? <MFAVerification /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* No Role Route */}
      <Route path="/no-role" element={<NoRolePage />} />

      {/* Under Construction Route */}
      <Route
        path="/under-construction"
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
      <ErrorBoundary>
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
      </ErrorBoundary>
    </Router>
  );
}
