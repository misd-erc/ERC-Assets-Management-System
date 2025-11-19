import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
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
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { decrypt } from '@/utils/encryption';

interface NavigationItem {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id: string;
  badge?: string;
  isUnderConstruction?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface AppSidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export function AppSidebar({ activeModule, onModuleChange }: AppSidebarProps) {
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  // Get user scopes and admin status from decrypted userDetails
  const { userScopes, isAdmin } = useMemo(() => {
    if (!userProfile) return { userScopes: [], isAdmin: false };

    try {
      const encryptedUserDetails = localStorage.getItem('userDetails');
      if (!encryptedUserDetails) return { userScopes: [], isAdmin: false };

      const decryptedUserDetails = JSON.parse(decrypt(encryptedUserDetails));
      const scopes: string[] = [];
      let admin = false;

      decryptedUserDetails.systemRole?.forEach((role: any) => {
        if (role.roleName === 'Administrator') {
          admin = true;
        }
        if (role.isActive && !role.isDeleted && Array.isArray(role.scope)) {
          role.scope.forEach((scopeItem: any) => {
            if (scopeItem.module && scopeItem.module.name) {
              scopes.push(scopeItem.module.name);
            }
          });
        }
      });

      return { userScopes: scopes, isAdmin: admin };
    } catch (error) {
      console.error('Error decrypting user details:', error);
      return { userScopes: [], isAdmin: false };
    }
  }, [userProfile]);

  const baseNavigationGroups: NavigationGroup[] = [
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
          isUnderConstruction: true,
        },
        {
          title: 'Delivery & Receipt of Items',
          icon: Package,
          id: 'deliveries-receipts',
          isUnderConstruction: true,
        },
        {
          title: 'Supply Management',
          icon: Send,
          id: 'supply-management',
          isUnderConstruction: true,
        },
        {
          title: 'Transfers & Returns',
          icon: ArrowRightLeft,
          id: 'transfers-returns',
          isUnderConstruction: true,
        },
        {
          title: 'Disposal of Properties',
          icon: Trash2,
          id: 'disposals',
          isUnderConstruction: true,
        },
        {
          title: 'Contract Management',
          icon: FileText,
          id: 'contracts',
          isUnderConstruction: true,
        },
      ],
    },
    {
      title: 'Asset Management',
      items: [
        {
          title: 'PPE & SE',
          icon: Package,
          id: 'ppe-se',
        },
        {
          title: 'PPE & Semi-Expendables',
          icon: HardHat,
          id: 'ppe-semi-expendables',
          isUnderConstruction: true,
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
          isUnderConstruction: true,
        },
        {
          title: 'Approvals',
          icon: CheckCircle,
          id: 'approvals',
          badge: '3',
          isUnderConstruction: true,
        },
      ],
    },
    ...(isAdmin ? [{
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
          isUnderConstruction: true,
        },
        {
          title: 'Audit Logs',
          icon: FileSearch,
          id: 'audit-logs',
        },
      ],
    }] : []),
  ];

  // Filter navigation groups based on user scopes
  const navigationGroups = useMemo(() => {
    return baseNavigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Always show dashboard
        if (item.id === 'dashboard') return true;

        // Active modules that are always shown
        const activeModules = ['ppe-se', 'users-roles', 'office-management', 'roles-management', 'audit-logs'];
        if (activeModules.includes(item.id)) return true;

        const moduleMapping: Record<string, string> = {
          'category-management': 'Category Management',
          'deliveries-receipts': 'Delivery & Receipt of Items',
          'supply-management': 'Supply Management',
          'transfers-returns': 'Transfers & Returns',
          'disposals': 'Disposal of Properties',
          'contracts': 'Contract Management',
          'ppe-se': 'PPE & SE',
          'ppe-semi-expendables': 'PPE & Semi-Expendables',
          'reports': 'Reports Center',
          'approvals': 'Approvals',
          'users-roles': 'User Management',
          'office-management': 'Office Management',
          'roles-management': 'Roles Management',
          'settings': 'System Settings',
          'audit-logs': 'Audit Logs'
        };

        const requiredModule = moduleMapping[item.id];

        if (isAdmin) {
          // Administrators see all items
          return true;
        } else {
          // Non-admins see only items in their scopes
          return requiredModule ? userScopes.includes(requiredModule) : false;
        }
      })
    })).filter(group => group.items.length > 0);
  }, [userScopes, isAdmin]);

  const handleModuleChange = useCallback(
    (moduleId: string) => {
      if (moduleId !== activeModule) {
        onModuleChange(moduleId);
      }
    },
    [activeModule, onModuleChange]
  );

  return (
    <Sidebar className="w-64 shrink-0 border-r bg-white">
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
        <nav className="space-y-1 px-4 py-4">
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 px-4 mb-1 mt-4">{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(({ id, title, icon: Icon, badge, isUnderConstruction }) => {
                    const isActiveModule = ['dashboard', 'ppe-se', 'users-roles', 'office-management', 'roles-management', 'audit-logs'].includes(id);
                    return (
                      <SidebarMenuItem key={id}>
                        <SidebarMenuButton
                          onClick={() => isActiveModule ? handleModuleChange(id) : navigate('/under-construction', { state: { moduleName: title } })}
                          isActive={activeModule === id}
                          className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 truncate ${activeModule === id ? 'bg-blue-50 text-blue-600 font-semibold' : ''}`}
                          aria-current={activeModule === id ? 'page' : undefined}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{title}</span>
                          {badge && (
                            <Badge variant="destructive" className="ml-auto text-xs">
                              {badge}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
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




