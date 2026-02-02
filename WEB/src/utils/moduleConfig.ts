import {
  LayoutDashboard,
  Package,
  HardHat,
  Users,
  Shield,
  Building2,
  Settings,
  FileSearch,
  Tag,
  ArrowRightLeft,
  Archive,
  FileText,
} from "lucide-react";

// CONFIG MAP FOR KNOWN MODULES
export const moduleConfig: Record<string, any> = {
  DB: {
    id: "dashboard",
    title: "Dashboard",
    group: "Overview",
    icon: LayoutDashboard,
    implemented: true,
  },

  PPESE: {
    id: "ppe-se",
    title: "PPE & SE",
    group: "Asset Management",
    icon: Package,
    implemented: true,
  },

  PPESEx: {
    id: "ppe-semi-expendables",
    title: "PPE & Semi-Expendables",
    group: "Asset Management",
    icon: HardHat,
    implemented: false,
  },

  CATM: {
    id: "category-management",
    title: "Category Management",
    group: "Asset Management",
    icon: Tag,
    implemented: true,
  },

  UM: {
    id: "users-roles",
    title: "User Management",
    group: "Administration",
    icon: Users,
    implemented: true,
  },

  RM: {
    id: "roles-management",
    title: "Roles Management",
    group: "Administration",
    icon: Shield,
    implemented: true,
  },

  OM: {
    id: "office-management",
    title: "Office Management",
    group: "Administration",
    icon: Building2,
    implemented: true,
  },

  SYSSET: {
    id: "system-settings",
    title: "System Settings",
    group: "Administration",
    icon: Settings,
    implemented: true,
  },

  AL: {
    id: "audit-logs",
    title: "Audit Logs",
    group: "Administration",
    icon: FileSearch,
    implemented: true,
  },

  TR: {
    id: "transfers-returns",
    title: "Transfers & Returns",
    group: "Asset Management",
    icon: ArrowRightLeft,
    implemented: true,
    roleAccess: {
      id: 9,
      module: {
        id: 7,
        name: "Transfers & Returns",
        acronym: "TR",
        isActive: false,
        isDeleted: false,
        createdAt: "2025-12-18T10:05:42.7400252"
      },
      isActive: true,
      isDeleted: false,
      createdAt: "2026-01-22T16:36:33.5689528"
    }
  },

  SM: {
    id: "supply-management",
    title: "Supply Management",
    group: "Asset Management",
    icon: Archive,  
    implemented: false, 
  },

  CM: {
    id: "contract-management",
    title: "Contract Management",
    group: "Asset Management",
    icon: FileText,  
    implemented: true, 
  },

};

export const fallbackModule = {
  group: "Other Modules",
  icon: Package,
  implemented: false,
};

// ADMIN OVERRIDES
export const adminOverrideModules = ["DB", "CM", "UM", "RM", "OM", "AL", "SYSSET"];
