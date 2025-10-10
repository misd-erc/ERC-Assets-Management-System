import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks';

interface TopbarProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export const TopBar: React.FC<TopbarProps> = ({ onMenuClick, isMobile }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const leftOffset = isMobile ? 'left-0' : 'left-64';
  const searchFlex = isMobile ? 'flex-1' : 'flex-1 max-w-lg';

  const userInitials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
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

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm select-none">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">@{user?.username || 'user'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
