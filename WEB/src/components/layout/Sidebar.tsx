﻿import React, { useMemo } from 'react';
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
  Calendar,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { decrypt } from '@/utils/encryption';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  adminOnly?: boolean;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  activeModule: string;
  onModuleChange: (id: string) => void;
  isMobile?: boolean;
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Core Operations',
    items: [
      { id: 'category-management', title: 'Category Management', icon: FolderOpen },
      { id: 'deliveries-receipts', title: 'Delivery & Receipt of Items', icon: Package },
      { id: 'supplies-inventory', title: 'Supplies Inventory', icon: Send },
      { id: 'supply-management', title: 'RIS & Stock Management', icon: Send },
      { id: 'transfers-returns', title: 'Transfers & Returns', icon: ArrowRightLeft },
      { id: 'disposals', title: 'Disposal of Properties', icon: Trash2 },
      { id: 'contracts', title: 'Contract Management', icon: FileText },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      { id: 'ppe-se', title: 'PPE & SE', icon: Package },
      { id: 'ppe-semi-expendables', title: 'PPE & Semi-Expendables', icon: HardHat },
    ],
  },
  {
    title: 'Reports & Approvals',
    items: [
      { id: 'reports', title: 'Reports Center', icon: BarChart3 },
      { id: 'approvals', title: 'Approvals', icon: CheckCircle, badge: '3' },
    ],
  },
  {
    title: 'Tools & Communication',
    items: [
      { id: 'calendar-notifications', title: 'Calendar & Notifications', icon: Calendar },
      { id: 'communication-tools', title: 'Communication Tools', icon: MessageSquare },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'users-roles', title: 'User Management', icon: Users, adminOnly: true },
      { id: 'office-management', title: 'Office Management', icon: Building2, adminOnly: true },
      { id: 'roles-management', title: 'Roles Management', icon: Shield, adminOnly: true },
      { id: 'settings', title: 'System Settings', icon: Settings, adminOnly: true },
      { id: 'audit-logs', title: 'Audit Logs', icon: FileSearch, adminOnly: true },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange, isMobile }) => {
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

  // Filter navigation groups based on user scopes
  const filteredNavigationGroups = useMemo(() => {
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Always show dashboard
        if (item.id === 'dashboard') return true;

        const moduleMapping: Record<string, string> = {
          'category-management': 'Category Management',
          'deliveries-receipts': 'Delivery & Receipt of Items',
          'supplies-inventory': 'Supplies Inventory',
          'supply-management': 'Supply Management',
          'transfers-returns': 'Transfers & Returns',
          'disposals': 'Disposal of Properties',
          'contracts': 'Contract Management',
          'ppe-semi-expendables': 'PPE & Semi-Expendables',
          'par-ics': 'PAR / ICS',
          'reports': 'Reports Center',
          'approvals': 'Approvals',
          'calendar-notifications': 'Calendar & Notifications',
          'communication-tools': 'Communication Tools',
          'users-roles': 'User Management',
          'office-management': 'Office Management',
          'roles-management': 'Roles Management',
          'settings': 'System Settings',
          'audit-logs': 'Audit Logs'
        };

        const requiredModule = moduleMapping[item.id];

        if (isAdmin) {
          // Administrators see items in their scopes or admin-only items
          return (requiredModule ? userScopes.includes(requiredModule) : false) || item.adminOnly;
        } else {
          // Non-admins see only items in their scopes
          return requiredModule ? userScopes.includes(requiredModule) : false;
        }
      })
    })).filter(group => group.items.length > 0);
  }, [userScopes, isAdmin]);

  return (
    <aside
      className={`${isMobile ? 'w-full h-full' : 'fixed top-0 left-0 w-64 h-full z-40'} bg-white border-r border-gray-200 shadow-sm flex flex-col`}
      aria-label="Sidebar"
    >
      <div className="flex items-center space-x-3 px-4 py-[1.32rem] border-b border-gray-200">
        <img src="/images/erc-logo.png" alt="ERC Logo" className="w-8 h-8 rounded" />
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Energy Regulatory Commission</p>
          <a
            href="#"
            className="text-xs text-blue-600 hover:underline truncate"
            title="Asset Management System"
          >
            Asset Management System
          </a>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Sidebar navigation">
        {filteredNavigationGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <ul className="mt-2 space-y-1" role="list">
              {group.items.map(({ id, title, icon: Icon, badge, adminOnly }) => (
                <li key={id}>
                  <button
                    onClick={() => onModuleChange(id)}
                    className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                      activeModule === id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    aria-current={activeModule === id ? 'page' : undefined}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        activeModule === id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{title}</span>
                    {badge && (
                      <Badge variant="destructive" className="ml-auto text-xs">
                        {badge}
                      </Badge>
                    )}
                    {adminOnly && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Admin
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-200 flex items-center space-x-2">
        <Building className="w-4 h-4 text-gray-400" aria-hidden="true" />
        <div className="flex flex-col min-w-0">
          <p className="text-xs truncate text-gray-500">Energy Regulatory Commission</p>
          <p className="text-xs truncate text-gray-400">Republic of the Philippines</p>
        </div>
      </div>
    </aside>
  );
};




