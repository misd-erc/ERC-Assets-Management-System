import React from 'react';
import { useAuthStore } from './stores/authStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { MFAVerification } from './components/auth/MFAVerification';
import { MainLayout } from './components/layout/MainLayout';

function AppContent() {
  const { isAuthenticated, requireMFA } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (requireMFA) {
    return <MFAVerification />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <AppContent />
    </div>
  );
}
