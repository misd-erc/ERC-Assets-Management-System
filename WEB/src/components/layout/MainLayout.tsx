import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";

// PAGES
import Dashboard from "@/pages/Dashboard";
import { PPESEPage } from "@/pages/PPESEPage";
import UserManagement from "@/pages/UserManagement";
import { RolesManagement } from "@/pages/RolesManagement";
import OfficeManagement from "@/pages/OfficeManagement";
import AuditLogs from "@/pages/AuditLogs";
import CategoryManagementPage from "@/pages/CategoryManagementPage";
import { MyProfile } from "@/components/profile/MyProfile";
import { SystemSettingsPage } from "@/pages/SystemSettingsPage";
import UCPage from "@/pages/UC";
import ContractManagement from "@/pages/ContractManagement";
import TransfersReturnsPage from "@/pages/TransfersReturnsPage";
import { SupplyManagement } from "@/pages/SupplyManagement";
import DeliveryManagement from "@/pages/DeliveryManagement";
import ReportsCenter from "@/pages/ReportsCenter";

export default function MainLayout() {
  const [activeModule, setActiveModule] = useState("dashboard");

  const renderPage = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />;

      case "ppe-se":
        return <PPESEPage />;

      case "supply-management":
        return <SupplyManagement />;

      case "delivery-receipt-items":
        return <DeliveryManagement />;

      case "contract-management":
        return <ContractManagement />;

      case "users-roles":
        return <UserManagement />;

      case "roles-management":
        return <RolesManagement />;

      case "office-management":
        return <OfficeManagement />;

      case "audit-logs":
        return <AuditLogs />;

      case "category-management":
        return <CategoryManagementPage />;

      case "system-settings":
        return <SystemSettingsPage />;

      case "profile":
        return <MyProfile />;

      case "transfers-returns":
        return <TransfersReturnsPage />;

      case "reports-center":
        return <ReportsCenter />;

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
