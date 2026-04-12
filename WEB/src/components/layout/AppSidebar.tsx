import React, { useMemo, useState, useEffect } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { decrypt, encrypt } from "@/utils/encryption";
import {
  moduleConfig,
  fallbackModule,
  adminOverrideModules,
} from "@/utils/moduleConfig";

import { getUserDetails } from "@/api/user-management/authApi";
import { Building, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { secureStorage } from "@/utils/secureStorage";

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

export function AppSidebar({ activeModule, onModuleChange, open = true, onOpenChange }: any) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const loadUserDetails = async () => {
      const encrypted = secureStorage.getItem("userDetails");
      if (encrypted) {
        try {
          const parsed = JSON.parse(decrypt(encrypted));
          if (isActive) setUserDetails(parsed);
          return;
        } catch (err) {
          console.warn("[Sidebar] Failed to decrypt cached user details", err);
        }
      }

      try {
        const fresh = await getUserDetails();
        const encryptedFresh = encrypt(JSON.stringify(fresh));
        secureStorage.setItem("userDetails", encryptedFresh);
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

  const navigationGroups: NavigationGroup[] = useMemo(() => {
    const grouped: Record<string, NavigationItem[]> = {};

    adminOverrideModules.forEach((acronym) => {
      const config = moduleConfig[acronym] || {
        ...fallbackModule,
        id: acronym.toLowerCase(),
        title: acronym,
        icon: Building,
        implemented: true,
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

    const groupOrder = [
      'Overview',
      'Core Operations',
      'Asset Management',
      'Reports & Approvals',
      'Administration',
    ];

    let dashboardGroup: NavigationGroup | undefined;
    let otherGroups: NavigationGroup[] = [];

    Object.entries(grouped).forEach(([group, items]) => {
      if (group === 'Overview') {
        dashboardGroup = { title: group, items };
      } else {
        otherGroups.push({ title: group, items });
      }
    });

    otherGroups.sort((a, b) => {
      const idxA = groupOrder.indexOf(a.title);
      const idxB = groupOrder.indexOf(b.title);
      return idxA - idxB;
    });

    return dashboardGroup ? [dashboardGroup, ...otherGroups] : otherGroups;
  }, []);

  const handleClick = (item: NavigationItem) => {
    if (item.implemented) {
      onModuleChange(item.id);
    } else {
      navigate("/under-construction", { state: { moduleName: item.title } });
    }
  };

  const collapsed = !open;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        className={`shrink-0 bg-white dark:bg-slate-900 fixed top-0 left-0 h-full z-40 transition-all duration-300 overflow-hidden border-r border-slate-100 dark:border-slate-800 shadow-[1px_0_8px_0_rgba(0,0,0,0.04)] ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarHeader className="p-0 border-b border-slate-100 dark:border-slate-800">
          {collapsed ? (
            <div className="flex justify-center py-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOpenChange?.(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-200 transition-all duration-200"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">Expand Menu</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800 shrink-0">
                <img src="/images/erc-logo.png" className="w-5 h-5" alt="ERC" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 truncate">
                  Asset Management
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate tracking-wide">
                  System
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onOpenChange?.(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-200 transition-all duration-200 shrink-0"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-medium">Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto">
          <nav className={`py-3 ${collapsed ? 'px-2 space-y-0.5' : 'px-3 space-y-4'}`}>
            {navigationGroups.map((group, gIdx) => (
              <SidebarGroup key={group.title} className="p-0">
                {!collapsed && (
                  <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                    {group.title}
                  </SidebarGroupLabel>
                )}
                {collapsed && gIdx > 0 && (
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                )}

                <SidebarGroupContent>
                  <SidebarMenu className={collapsed ? 'space-y-1' : 'space-y-0.5'}>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => handleClick(item)}
                                isActive={activeModule === item.id}
                                className={`flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150 ${
                                  activeModule === item.id
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                              >
                                <item.icon className="size-[18px] shrink-0" />
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <SidebarMenuButton
                            onClick={() => handleClick(item)}
                            isActive={activeModule === item.id}
                            className={`group flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm transition-all duration-150 ${
                              activeModule === item.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors duration-150 ${
                                activeModule === item.id
                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                              }`}
                            >
                              <item.icon className="size-3.5" />
                            </span>
                            <span className="truncate flex-1 text-[13px]">{item.title}</span>
                            {!item.implemented && (
                              <Badge
                                variant="secondary"
                                className="ml-auto text-[10px] px-1.5 py-0 h-4 font-medium shrink-0"
                              >
                                Soon
                              </Badge>
                            )}
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 p-0">
          {collapsed ? (
            <div className="flex justify-center py-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800">
                    <img src="/images/erc-logo.png" className="w-5 h-5" alt="ERC" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">Energy Regulatory Commission</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800 shrink-0">
                <img src="/images/erc-logo.png" className="w-5 h-5" alt="ERC" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">Energy Regulatory Commission</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Republic of the Philippines</p>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-600 shrink-0 self-end pb-0.5">
                v{process.env.REACT_APP_Version}
              </span>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}