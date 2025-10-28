import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { LoginScreen } from './components/auth/LoginScreen';
import { MFAVerification } from './components/auth/MFAVerification';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isSessionValid } from './utils/sessionUtils';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, requireMFA } = useAuthStore();
  const hasValidSession = isSessionValid();

  console.log('[ProtectedRoute] Auth check:', { isAuthenticated, requireMFA, hasValidSession });

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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // All checks passed, render the protected content
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
