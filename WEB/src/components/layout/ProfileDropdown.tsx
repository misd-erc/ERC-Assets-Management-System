import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useAuth } from '../../hooks';
import { MyProfile } from '../profile/MyProfile';
import { useNavigate } from 'react-router-dom';
import { getUserDetails } from '../../api/authApi';
import { useAuthStore } from '../../store/auth';

interface ProfileDropdownProps {
  onNavigate?: (module: string) => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { systemUserIdEncrypted } = useAuthStore();
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  // Get user details from localStorage
  const getUserDetailsFromStorage = () => {
    const stored = localStorage.getItem('userDetails');
    return stored ? JSON.parse(stored) : null;
  };

  const userDetails = getUserDetailsFromStorage();
  const userName = userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : 'User';
  const userEmail = userDetails ? userDetails.email : 'user@example.com';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleLogout = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const handleMyProfileClick = async () => {
    if (!systemUserIdEncrypted) return;

    setIsFetchingProfile(true);
    try {
      const userData = await getUserDetails(systemUserIdEncrypted, systemUserIdEncrypted);
      localStorage.setItem('userProfile', JSON.stringify(userData));
      navigate('/profile');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Still navigate, will show fallback
      navigate('/profile');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-slate-100">
            <Avatar className="w-8 h-8 border-2 border-blue-200">
              <AvatarFallback className="text-sm font-semibold text-blue-700 bg-blue-50">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-slate-900 truncate max-w-32">
                {userName}
              </span>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs px-2 py-0.5 border ${getRoleBadgeColor('user')}`}>
                  USER
                </Badge>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          <DropdownMenuContent
            align="end"
            className="w-64 p-2"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* User Info Header */}
              <div className="px-3 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-blue-200">
                    <AvatarFallback className="text-lg font-semibold text-blue-700 bg-blue-50">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      @{userEmail}
                    </p>
                    <Badge className={`text-xs px-2 py-0.5 mt-1 border ${getRoleBadgeColor('user')}`}>
                      USER
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50"
                onClick={handleMyProfileClick}
                disabled={isFetchingProfile}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">My Profile</p>
                  <p className="text-xs text-slate-500">View and edit your profile</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-red-50 text-red-700"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sign Out</p>
                  <p className="text-xs text-red-500">Log out of your account</p>
                </div>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuContent>
        </AnimatePresence>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to sign out? Any unsaved changes will be lost.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
