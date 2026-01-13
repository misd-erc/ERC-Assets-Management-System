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
};

// FALLBACK FOR UNKNOWN MODULES
export const fallbackModule = {
  group: "Other Modules",
  icon: Package,
  implemented: false,
};

// ADMIN OVERRIDES
export const adminOverrideModules = ["UM", "RM", "OM", "AL", "SYSSET"];
