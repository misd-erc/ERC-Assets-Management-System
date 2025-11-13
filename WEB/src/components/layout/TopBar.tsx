import React, { useState } from 'react';
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
import { ProfileDropdown } from './ProfileDropdown';

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  onNavigate?: (module: string) => void;
}

export const TopBar: React.FC<TopbarProps> = ({ onMenuClick, isMobile, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { logout } = useAuth();

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
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
        className={`fixed top-0 ${leftOffset} right-0 h-20 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-4 sm:px-6`}
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
          <label htmlFor="search" className="sr-only">
            Search across all modules
          </label>
          <div className="relative text-gray-400 focus-within:text-gray-600">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search"
              type="search"
              placeholder="Search across all modules... (Press Ctrl+K)"
              className="w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                <Command className="w-3 h-3 mr-1" />
                K
              </Badge>
            </div>
          </div>
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





