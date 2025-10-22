import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
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
import { AccountSettings } from '../profile/AccountSettings';
import { SecurityPrivacy } from '../profile/SecurityPrivacy';

interface ProfileDropdownProps {
  onNavigate?: (module: string) => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Get user details from localStorage
  const getUserDetails = () => {
    const stored = localStorage.getItem('userDetails');
    return stored ? JSON.parse(stored) : null;
  };

  const userDetails = getUserDetails();
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
                onClick={() => setProfileDialogOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">My Profile</p>
                  <p className="text-xs text-slate-500">View and edit your profile</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setSettingsDialogOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Account Settings</p>
                  <p className="text-xs text-slate-500">Manage your preferences</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setSecurityDialogOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Security & Privacy</p>
                  <p className="text-xs text-slate-500">Manage security settings</p>
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

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
          </DialogHeader>
          <MyProfile />
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          <AccountSettings />
        </DialogContent>
      </Dialog>

      {/* Security Dialog */}
      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security & Privacy</DialogTitle>
          </DialogHeader>
          <SecurityPrivacy />
        </DialogContent>
      </Dialog>

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
