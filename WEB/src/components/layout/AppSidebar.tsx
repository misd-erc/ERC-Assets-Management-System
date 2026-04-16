// AppSidebar.tsx (Permission-based version)
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { decrypt, encrypt } from "@/utils/encryption";
import {
  moduleConfig,
  fallbackModule,
  adminOverrideModules,
} from "@/utils/moduleConfig";

import { getUserDetails } from "@/api/user-management/authApi";

import { Building, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { secureStorage } from "@/utils/secureStorage";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  // ----------------------
  // LOAD USER DETAILS
  // ----------------------
  useEffect(() => {
    let isActive = true;

    const loadUserDetails = async () => {
      // Try local cache first
      const encrypted = secureStorage.getItem("userDetails");
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

  const effectiveAcronyms = useMemo(() => {
    const set = new Set(acronyms);
    // Always surface PPE/SE Issuance while backend scopes are being rolled out
    set.add("PPEISS");
    return Array.from(set);
  }, [acronyms]);

  // ----------------------
  // BUILD NAVIGATION GROUPS
  // ----------------------
  const navigationGroups: NavigationGroup[] = useMemo(() => {
    const grouped: Record<string, NavigationItem[]> = {};

    effectiveAcronyms.forEach((acronym) => {
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
  }, [effectiveAcronyms]);

  // ----------------------
  // CLICK HANDLER
  // ----------------------
  const handleClick = (item: NavigationItem) => {
    if (item.implemented) {
      onModuleChange(item.id);
      // On mobile, close sidebar after navigation
      if (isMobile && onOpenChange) {
        onOpenChange(false);
      }
    } else {
      navigate("/under-construction", { state: { moduleName: item.title } });
      if (isMobile && onOpenChange) {
        onOpenChange(false);
      }
    }
  };

  const collapsed = !open;

  // ----------------------
  // DESKTOP SIDEBAR
  // ----------------------
  if (!isMobile) {
    return (
      <TooltipProvider delayDuration={0}>
        <div
          className={`shrink-0 bg-white dark:bg-slate-900 fixed top-0 left-0 h-full z-40 transition-all duration-300 overflow-hidden border-r border-slate-100 dark:border-slate-800 shadow-[1px_0_8px_0_rgba(0,0,0,0.04)] ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Header */}
          <div className="p-0 border-b border-slate-100 dark:border-slate-800">
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
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-120px)]">
            <nav className={`py-3 ${collapsed ? 'px-2 space-y-0.5' : 'px-3 space-y-4'}`}>
              {navigationGroups.map((group, gIdx) => (
                <div key={group.title} className="p-0">
                  {!collapsed && (
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                      {group.title}
                    </div>
                  )}
                  {collapsed && gIdx > 0 && (
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                  )}

                  <div>
                    <div className={collapsed ? 'space-y-1' : 'space-y-0.5'}>
                      {group.items.map((item) => (
                        <div key={item.id}>
                          {collapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleClick(item)}
                                  className={`flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150 ${
                                    activeModule === item.id
                                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                >
                                  <item.icon className="size-[18px] shrink-0" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs font-medium">
                                {item.title}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <button
                              onClick={() => handleClick(item)}
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
                              <span className="truncate flex-1 text-[13px] text-left">{item.title}</span>
                              {!item.implemented && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-[10px] px-1.5 py-0 h-4 font-medium shrink-0"
                                >
                                  Soon
                                </Badge>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-0 absolute bottom-0 w-full bg-white dark:bg-slate-900">
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
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ----------------------
  // MOBILE SIDEBAR (Slide-out panel)
  // ----------------------
  if (!open) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed inset-0 z-50">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => onOpenChange?.(false)}
        />
        
        {/* Sidebar panel */}
        <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 transform translate-x-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800 shrink-0">
                <img src="/images/erc-logo.png" className="w-5 h-5" alt="ERC" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Asset Management
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 tracking-wide">
                  System
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange?.(false)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <nav className="py-3 px-3 space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.title} className="p-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleClick(item)}
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
                        <span className="truncate flex-1 text-[13px] text-left">{item.title}</span>
                        {!item.implemented && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] px-1.5 py-0 h-4 font-medium shrink-0"
                          >
                            Soon
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-100 dark:ring-blue-800 shrink-0">
                <img src="/images/erc-logo.png" className="w-5 h-5" alt="ERC" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">Energy Regulatory Commission</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Republic of the Philippines</p>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-600 shrink-0">
                v{process.env.REACT_APP_Version}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}