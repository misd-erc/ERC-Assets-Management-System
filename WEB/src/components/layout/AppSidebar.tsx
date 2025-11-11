import React, { useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '../ui/sidebar';
import {
  LayoutDashboard,
  Package,
  HardHat,
  FileText,
  ArrowRightLeft,
  Trash2,
  BarChart3,
  Users,
  Settings,
  FileSearch,
  Shield,
  Building,
  FolderOpen,
  CheckCircle,
  Send,
  Building2,
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface NavigationItem {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id: string;
  badge?: string;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface AppSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        id: 'dashboard',
      },
    ],
  },
  {
    title: 'Core Operations',
    items: [
      {
        title: 'Category Management',
        icon: FolderOpen,
        id: 'category-management',
      },
      {
        title: 'Delivery & Receipt of Items',
        icon: Package,
        id: 'deliveries-receipts',
      },
      {
        title: 'Supply Management',
        icon: Send,
        id: 'supply-management',
      },
      {
        title: 'Transfers & Returns',
        icon: ArrowRightLeft,
        id: 'transfers-returns',
      },
      {
        title: 'Disposal of Properties',
        icon: Trash2,
        id: 'disposals',
      },
      {
        title: 'Contract Management',
        icon: FileText,
        id: 'contracts',
      },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      {
        title: 'PPE & Semi-Expendables',
        icon: HardHat,
        id: 'ppe-semi-expendables',
      },
      {
        title: 'PAR / ICS',
        icon: FileText,
        id: 'par-ics',
      },
    ],
  },
  {
    title: 'Reports & Approvals',
    items: [
      {
        title: 'Reports Center',
        icon: BarChart3,
        id: 'reports',
      },
      {
        title: 'Approvals',
        icon: CheckCircle,
        id: 'approvals',
        badge: '3',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'User Management',
        icon: Users,
        id: 'users-roles',
      },
      {
        title: 'Office Management',
        icon: Building2,
        id: 'office-management',
      },
      {
        title: 'Roles Management',
        icon: Shield,
        id: 'roles-management',
      },
      {
        title: 'System Settings',
        icon: Settings,
        id: 'settings',
      },
      {
        title: 'Audit Logs',
        icon: FileSearch,
        id: 'audit-logs',
      },
    ],
  },
];

export function AppSidebar({ activeModule, onModuleChange }: AppSidebarProps) {
  const handleModuleChange = useCallback(
    (moduleId: string) => {
      if (moduleId !== activeModule) {
        onModuleChange(moduleId);
      }
    },
    [activeModule, onModuleChange]
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center space-x-3 px-4 py-3">
          <img
            src="/images/erc-logo.png"
            alt="ERC Logo"
            className="w-8 h-8 rounded"
          />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              Energy Regulatory Commission
            </p>
            <a
              href="#"
              className="text-xs text-blue-600 hover:underline truncate"
              title="Asset Management System"
            >
              Asset Management System
            </a>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ id, title, icon: Icon, badge }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      onClick={() => handleModuleChange(id)}
                      isActive={activeModule === id}
                      className="w-full justify-start"
                      aria-current={activeModule === id ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{title}</span>
                      {badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center space-x-2 px-4 py-3">
          <Building className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">Energy Regulatory Commission</p>
            <p className="text-xs text-muted-foreground">Republic of the Philippines</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
