import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export const Topbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-20 flex items-center justify-between px-6"
      role="banner"
    >
      {/* Search bar */}
      <div className="flex-1 max-w-lg">
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
      <div className="flex items-center space-x-6 min-w-0">
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
            SA
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">System Administrator</p>
            <p className="text-xs text-gray-500 truncate">@admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};
