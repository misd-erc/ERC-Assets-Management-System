// TopBar.tsx
import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Clock, Command, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth, useDarkMode } from '@/hooks';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  onNavigate?: (module: string) => void;
  sidebarOpen?: boolean;
}

export const TopBar: React.FC<TopbarProps> = ({ onMenuClick, isMobile: propIsMobile, onNavigate, sidebarOpen }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  
  // Always call useMediaQuery unconditionally
  const mediaQueryIsMobile = useMediaQuery("(max-width: 768px)");
  // Use prop if provided, otherwise use hook result
  const isMobile = propIsMobile !== undefined ? propIsMobile : mediaQueryIsMobile;

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Open search on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const leftOffset = isMobile ? 'left-0' : (sidebarOpen === false ? 'left-16' : 'left-64');
  const searchFlex = isMobile ? 'flex-1' : 'flex-1 max-w-lg';

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 ${leftOffset} right-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm z-40 flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-[0.08rem] transition-all duration-300`}
        role="banner"
      >
        {/* Mobile menu button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="mr-2 shrink-0 text-slate-500 hover:text-blue-600"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Search bar */}
        <div className={searchFlex}>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center rounded-md border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-1.5 sm:py-2 pl-2 sm:pl-3 pr-2 sm:pr-4 text-xs sm:text-sm text-gray-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            aria-label="Open global search (Ctrl+K)"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
            <span className="flex-1 text-left truncate text-xs sm:text-sm">
              {isMobile ? "Search..." : "Search assets, supply, employees..."}
            </span>
            {!isMobile && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ml-2 shrink-0">
                <Command className="w-3 h-3 mr-1" />
                K
              </Badge>
            )}
          </button>
        </div>

        {/* Session info, notifications, user */}
        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-0">
          {/* Time display - hidden on very small screens */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="relative text-slate-500 hover:text-blue-600 shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="relative shrink-0" 
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[9px] sm:text-xs bg-red-500">
              3
            </Badge>
          </Button>

          <ProfileDropdown
            onNavigate={onNavigate}
          />
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={onNavigate}
      />

      {/* Notification Center */}
      <NotificationCenter
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Logout</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};