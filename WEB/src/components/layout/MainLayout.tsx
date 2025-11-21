import React, { useState, Suspense, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import Dashboard from '@/pages/Dashboard';
import { MyProfile } from '@/components/profile/MyProfile';
import UserManagement from '@/pages/UserManagement';
import { RolesManagement } from '@/pages/RolesManagement';
import AuditLogs from '@/pages/AuditLogs';
import UnderConstructionPage from '@/pages/UC';
import SupplyManagement from '@/pages/SupplyManagement';
import { PPESEPage } from '@/pages/PPESEPage';
import { useIsMobile } from '@/components/ui/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import OfficeManagement from '@/pages/OfficeManagement';


export default function MainLayout() {
  const [activeModule, setActiveModule] = useState("dashboard");

  const renderPage = () => {
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
      case 'supplies-inventory':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SupplyManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case 'category-management':
      case 'deliveries-receipts':
      case 'supply-management':
      case 'transfers-returns':
      case 'disposals':
      case 'contracts':
      case 'ppe-se':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <PPESEPage />
            </Suspense>
          </ErrorBoundary>
        );
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
        return <UCPage />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div className="flex flex-col flex-1 overflow-hidden ml-64">
        <TopBar onNavigate={setActiveModule} />

        <div className="flex-1 overflow-auto p-6">
          {renderPage()}
        </div>
      </div>
    </SidebarProvider>
  );
}
