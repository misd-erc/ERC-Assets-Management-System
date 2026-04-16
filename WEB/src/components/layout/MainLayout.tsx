// MainLayout.tsx
import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
import PPEIssuancePage from "@/pages/PPEIssuancePage";
import DisposalsPage from "@/pages/disposals/DisposalsPage";
import AssetTaggingPage from "@/pages/AssetTaggingPage";

export default function MainLayout() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // On mobile, sidebar starts closed; on desktop, starts expanded
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const renderPage = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />;

      case "ppe-se":
        return <PPESEPage />;

      case "ppe-se-issuance":
        return <PPEIssuancePage />;

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

      case "disposals":
        return <DisposalsPage />;

      case "asset-tagging":
        return <AssetTaggingPage />;

      default:
        return <UCPage />;
    }
  };

  // Calculate margin based on sidebar state (desktop only)
  const getContentMargin = () => {
    if (isMobile) {
      return 0; // No margin on mobile
    }
    return sidebarOpen ? 'ml-64' : 'ml-16';
  };

  return (
    <SidebarProvider>
      <AppSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${getContentMargin()}`}>
        <TopBar
          onNavigate={setActiveModule}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(o => !o)}
          isMobile={isMobile}
        />

        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : 'pt-16'} p-4 sm:p-6`}>
          {renderPage()}
        </div>
      </div>
    </SidebarProvider>
  );
}