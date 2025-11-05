import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { LoginScreen } from './components/auth/LoginScreen';
import { MFAVerification } from './components/auth/MFAVerification';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isSessionValid, isSessionExpired, handleSessionExpired } from './utils/sessionUtils';
import NoRolePage from './pages/no-role';
import { decrypt } from './utils/encryption';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { requireMFA } = useAuthStore();
  const hasValidSession = isSessionValid();
  const isExpired = isSessionExpired();

  console.log('[ProtectedRoute] Auth check:', { requireMFA, hasValidSession, isExpired });

  // If session is expired, handle expiration and redirect
  if (isExpired) {
    console.log('[ProtectedRoute] Session expired, handling expiration');
    handleSessionExpired('Your session has expired. Please log in again.');
    return <Navigate to="/" replace />;
  }

  // If no valid session token, redirect to login
  if (!hasValidSession) {
    console.log('[ProtectedRoute] No valid session, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // If MFA is required, redirect to MFA page
  if (requireMFA) {
    console.log('[ProtectedRoute] MFA required, redirecting to MFA');
    return <Navigate to="/mfa" replace />;
  }

  // Check user role access
  const encryptedUserDetails = localStorage.getItem('userDetails');
  if (encryptedUserDetails) {
    try {
      const userDetails = JSON.parse(decrypt(encryptedUserDetails));
      const systemRoleId = userDetails.systemRoleId;
      const isActive = userDetails.isActive;

      // Redirect to no-role if:
      // - systemRoleId is null or 0
      // - isActive is false
      // - user has role but isActive is false
      // - user doesn't have role but isActive is true
      if (!systemRoleId || systemRoleId === 0 || !isActive) {
        console.log('[ProtectedRoute] User does not have required role or is inactive, redirecting to no-role');
        return <Navigate to="/no-role" replace />;
      }
    } catch (error) {
      console.error('[ProtectedRoute] Error checking user access:', error);
      return <Navigate to="/no-role" replace />;
    }
  } else {
    console.log('[ProtectedRoute] No user details found, redirecting to no-role');
    return <Navigate to="/no-role" replace />;
  }

  // Session is valid, user has role and is active, allow access
  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, requireMFA, initialize } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    console.log('[App] Initializing application...');
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
