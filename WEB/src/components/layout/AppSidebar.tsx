import React, { useCallback, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import { decrypt } from "@/utils/encryption";
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
  id: string;
  title: string;
  icon: any;
  group: string;
  implemented: boolean;
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
          title: 'PPE & SE',
          icon: Package,
          id: 'ppe-se',
        },
        {
          title: 'PPE & Semi-Expendables',
          icon: HardHat,
          id: 'ppe-semi-expendables',
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
        <div className="flex items-center gap-3 px-4 py-3">
          <img src="/images/erc-logo.png" className="w-8 h-8" />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-semibold truncate">
              Energy Regulatory Commission
            </p>
            <p className="text-xs text-blue-600 truncate">
              Asset Management System
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav className="space-y-3 px-4 py-4">
          {navigationGroups.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 px-2 mb-1">
                {group.title}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleClick(item)}
                        isActive={activeModule === item.id}
                        className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm hover:bg-slate-100 truncate ${
                          activeModule === item.id
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>

                        {!item.implemented && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Soon
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center space-x-2 px-4 py-3">
          <Building className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">
              Energy Regulatory Commission
            </p>
            <p className="text-xs text-muted-foreground">
              Republic of the Philippines
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
