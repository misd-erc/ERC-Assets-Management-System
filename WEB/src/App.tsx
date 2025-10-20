import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { LoginScreen } from './components/auth/LoginScreen';
import { MFAVerification } from './components/auth/MFAVerification';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/sonner';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page or contact support if the problem persists.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { isAuthenticated, requireMFA, initialize } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/" element={!isAuthenticated ? <LoginScreen /> : <Navigate to="/dashboard" />} />
      <Route path="/mfa" element={requireMFA ? <MFAVerification /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={isAuthenticated && !requireMFA ? <MainLayout /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <AppContent />
        </div>
        <Toaster />
      </ErrorBoundary>
    </Router>
  );
}
