import React, { useState, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from '../dashboard/Dashboard';
import { MyProfile } from '../profile/MyProfile';
import UserManagement from '../../pages/UserManagement';
import { useIsMobile } from '../ui/use-mobile';
import { Sheet, SheetContent } from '../ui/sheet';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-gray-500">Loading...</div>
  </div>
);

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(() => {
    // Initialize activeModule based on current pathname
    if (location.pathname === '/profile') return 'profile';
    return 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Sync navigation when activeModule changes
  useEffect(() => {
    if (activeModule === 'profile') {
      navigate('/profile');
    } else {
      navigate('/dashboard');
    }
  }, [activeModule, navigate]);

  const renderContent = () => {
    switch (activeModule) {
      case 'profile':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <MyProfile />
            </Suspense>
          </ErrorBoundary>
        );
      case 'dashboard':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard onNavigate={setActiveModule} />
            </Suspense>
          </ErrorBoundary>
        );
      case 'users-roles':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <UserManagement />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 z-40">
            <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} isMobile={isMobile} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} isMobile={isMobile} />
      )}
      <div className="flex flex-col flex-1">
        <TopBar onMenuClick={() => setSidebarOpen(true)} isMobile={isMobile} onNavigate={setActiveModule} />
        <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
