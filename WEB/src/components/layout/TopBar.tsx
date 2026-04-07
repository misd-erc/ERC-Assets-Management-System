import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Clock, Command } from 'lucide-react';
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
import { useAuth } from '@/hooks';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  onNavigate?: (module: string) => void;
}

export const TopBar: React.FC<TopbarProps> = ({ onMenuClick, isMobile, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { logout } = useAuth();

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

  const leftOffset = isMobile ? 'left-0' : 'left-64';
  const searchFlex = isMobile ? 'flex-1' : 'flex-1 max-w-lg';

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 ${leftOffset} right-0  bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-4 py-[0.08rem] sm:px-6`}
        role="banner"
      >
        {isMobile && onMenuClick && (
          <Button variant="ghost" size="sm" onClick={onMenuClick} className="mr-2">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        )}
        {/* Search bar */}
        <div className={searchFlex}>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center rounded-md border border-gray-300 bg-gray-50 py-2 pl-3 pr-4 text-sm text-gray-400 hover:border-blue-400 hover:bg-white transition-colors"
            aria-label="Open global search (Ctrl+K)"
          >
            <Search className="w-5 h-5 mr-2 shrink-0" />
            <span className="flex-1 text-left truncate">Search assets, supply, employees...</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 ml-2 shrink-0">
              <Command className="w-3 h-3 mr-1" />
              K
            </Badge>
          </button>
        </div>

        {/* Session info, notifications, user */}
        <div className="flex items-center space-x-4 sm:space-x-6 min-w-0">
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-xs text-gray-500">Session Active</span>
            <span className="text-xs font-semibold text-gray-900">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};






