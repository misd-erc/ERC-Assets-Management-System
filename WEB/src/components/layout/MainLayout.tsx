// MainLayout.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const modulePathMap: Record<string, string> = {
  "dashboard": "/dashboard",
  "ppe-se": "/ppe-se",
  "ppe-se-issuance": "/ppe-se-issuance",
  "asset-tagging": "/asset-tagging",
  "supply-management": "/supply-management",
  "delivery-receipt-items": "/delivery-receipt-items",
  "contract-management": "/contract-management",
  "users-roles": "/users-roles",
  "roles-management": "/roles-management",
  "office-management": "/office-management",
  "audit-logs": "/audit-logs",
  "category-management": "/category-management",
  "system-settings": "/system-settings",
  "profile": "/profile",
  "transfers-returns": "/transfers-returns",
  "reports-center": "/reports-center",
  "disposals": "/disposals",
};

const pathModuleMap: Record<string, string> = Object.entries(modulePathMap).reduce(
  (acc, [moduleId, path]) => {
    acc[path] = moduleId;
    return acc;
  },
  {} as Record<string, string>
);

const resolveModuleFromPath = (pathname: string): string => {
  if (pathModuleMap[pathname]) return pathModuleMap[pathname];
  return "dashboard";
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(resolveModuleFromPath(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const resolved = resolveModuleFromPath(location.pathname);
    setActiveModule(resolved);
  }, [location.pathname]);

  useEffect(() => {
    const knownPath = Object.values(modulePathMap).includes(location.pathname);
    const passthroughPath =
      location.pathname === "/under-construction" ||
      location.pathname === "/uc" ||
      location.pathname === "/no-role";

    if (!knownPath && !passthroughPath) {
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleModuleChange = (moduleId: string) => {
    const nextPath = modulePathMap[moduleId] ?? "/under-construction";
    navigate(nextPath);
  };

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
        onModuleChange={handleModuleChange}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${getContentMargin()}`}>
        <TopBar
          onNavigate={handleModuleChange}
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