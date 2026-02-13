import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
import { decrypt, encrypt } from "@/utils/encryption";
import {
  moduleConfig,
  fallbackModule,
  adminOverrideModules,
} from "@/utils/moduleConfig";

import { getUserDetails } from "@/api/user-management/authApi";

import { Building } from "lucide-react";

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

export function AppSidebar({ activeModule, onModuleChange }: any) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const navigate = useNavigate();

  // ----------------------
  // LOAD USER DETAILS
  // ----------------------
  useEffect(() => {
    let isActive = true;

    const loadUserDetails = async () => {
      // Try local cache first
      const encrypted = localStorage.getItem("userDetails");
      if (encrypted) {
        try {
          const parsed = JSON.parse(decrypt(encrypted));
          if (isActive) setUserDetails(parsed);
          return;
        } catch (err) {
          console.warn("[Sidebar] Failed to decrypt cached user details, refetching", err);
        }
      }

      // Fallback: fetch fresh details and cache them
      try {
        const fresh = await getUserDetails();
        const encryptedFresh = encrypt(JSON.stringify(fresh));
        localStorage.setItem("userDetails", encryptedFresh);
        if (isActive) setUserDetails(fresh);
      } catch (err) {
        console.error("[Sidebar] Unable to load user details", err);
      }
    };

    loadUserDetails();

    return () => {
      isActive = false;
    };
  }, []);

  // ----------------------
  // EXTRACT SCOPES (ACRONYM-BASED)
  // ----------------------
  const { acronyms } = useMemo(() => {
    if (!userDetails) return { acronyms: [] };

    const list: string[] = [];

    userDetails.systemRole?.forEach((role: any) => {
      role.scope?.forEach((s: any) => {
        if (s.module?.acronym) list.push(s.module.acronym);
      });
    });

    return { acronyms: list };
  }, [userDetails]);

  // ----------------------
  // BUILD NAVIGATION GROUPS
  // ----------------------
  const navigationGroups: NavigationGroup[] = useMemo(() => {
    const grouped: Record<string, NavigationItem[]> = {};

    acronyms.forEach((acronym) => {
      const config = moduleConfig[acronym] || {
        ...fallbackModule,
        id: acronym.toLowerCase(),
        title: acronym,
        icon: Building,
        implemented: false,
      };

      const item: NavigationItem = {
        id: config.id,
        title: config.title,
        icon: config.icon,
        group: config.group,
        implemented: config.implemented,
      };

      if (!grouped[config.group]) grouped[config.group] = [];
      grouped[config.group].push(item);
    });

    // Sidebar group order
    const groupOrder = [
      'Overview',
      'Core Operations',
      'Asset Management',
      'Reports & Approvals',
      'Administration',
    ];

    // Always put Dashboard at the top
    let dashboardGroup: NavigationGroup | undefined;
    let otherGroups: NavigationGroup[] = [];

    Object.entries(grouped).forEach(([group, items]) => {
      if (group === 'Overview') {
        dashboardGroup = { title: group, items };
      } else {
        otherGroups.push({ title: group, items });
      }
    });

    // Sort other groups by groupOrder
    otherGroups.sort((a, b) => {
      const idxA = groupOrder.indexOf(a.title);
      const idxB = groupOrder.indexOf(b.title);
      return idxA - idxB;
    });

    return dashboardGroup ? [dashboardGroup, ...otherGroups] : otherGroups;
  }, [acronyms]);

  // ----------------------
  // CLICK HANDLER
  // ----------------------
  const handleClick = (item: NavigationItem) => {
    if (item.implemented) {
      onModuleChange(item.id);
    } else {
      navigate("/under-construction", { state: { moduleName: item.title } });
    }
  };

  // ----------------------
  // RENDER UI
  // ----------------------
  return (
    <Sidebar className="w-64 shrink-0 border-r bg-white">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-1">
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
