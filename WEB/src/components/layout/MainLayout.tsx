import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Dashboard } from '../dashboard/Dashboard';
import { useIsMobile } from '../ui/use-mobile';
import { Sheet, SheetContent } from '../ui/sheet';

export function MainLayout() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      default:
        return <Dashboard />;
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
