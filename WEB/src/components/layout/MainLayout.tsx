import React, { useState, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import Dashboard from '../../pages/Dashboard';
import { MyProfile } from '../profile/MyProfile';
import UserManagement from '../../pages/UserManagement';
import { RolesManagement } from '../../pages/RolesManagement';
import AuditLogs from '../../pages/AuditLogs';
import UnderConstructionPage from '../../pages/UC';
import UnderConstructionContent from '../under-construction/UnderConstructionContent';
import SupplyManagement from '../../pages/supplies/SupplyManagement';
import { useIsMobile } from '../ui/use-mobile';
import { Sheet, SheetContent } from '../ui/sheet';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import OfficeManagement from '../../pages/OfficeManagement';

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

  // Sync activeModule with location changes
  useEffect(() => {
    if (location.pathname === '/profile') {
      setActiveModule('profile');
    } else if (location.pathname === '/dashboard') {
      setActiveModule('dashboard');
    }
  }, [location.pathname]);

  // Sync navigation when activeModule changes
  useEffect(() => {
    if (activeModule === 'profile') {
      navigate('/profile');
    } else if (activeModule === 'dashboard') {
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
              <Dashboard />
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
      case 'category-management':
      case 'deliveries-receipts':
      case 'supplies-inventory':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SupplyManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'supply-management':
      case 'transfers-returns':
      case 'disposals':
      case 'contracts':
      case 'ppe-semi-expendables':
      case 'par-ics':
      case 'reports':
      case 'approvals':
      case 'calendar-notifications':
      case 'communication-tools':
      case 'settings':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <UnderConstructionPage />
            </Suspense>
          </ErrorBoundary>
        );
      case 'audit-logs':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AuditLogs />
            </Suspense>
          </ErrorBoundary>
        );
      case 'office-management':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <OfficeManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'roles-management':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <RolesManagement />
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
