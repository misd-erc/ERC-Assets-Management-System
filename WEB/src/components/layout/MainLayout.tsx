import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './TopBar';
import { Dashboard } from '../dashboard/Dashboard';

export function MainLayout() {
  const [activeModule, setActiveModule] = useState('dashboard');

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <Topbar />
      <main className="pl-64 pt-16 pr-6 pb-6 overflow-y-auto bg-gray-50 min-h-screen">
        {renderContent()}
      </main>
    </>
  );
}
