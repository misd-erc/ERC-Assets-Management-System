import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUserDetails, getUserPhoto } from '../../api/userApi';
import { decrypt, encrypt } from '../../utils/encryption';

import { useAuthStore } from '../../store/auth';

interface ProfileDropdownProps {
  onNavigate?: (module: string) => void;
  user?: {
    firstName: string;
    lastName: string;
    systemRoleName: string;
    imageUrl?: string;
  };
  isLoading?: boolean;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onNavigate,
  user: propUser,
  isLoading = false
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { systemUserId } = useAuthStore();

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [photoFetched, setPhotoFetched] = useState(false);

  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    systemRoleName: string;
    imageUrl?: string;
  }>((() => {
    const stored = localStorage.getItem('userDetails');
    if (!stored) {
      return {
        firstName: 'User',
        lastName: '',
        systemRoleName: 'NO ROLE ASSIGNED',
      };
    }

    try {
      const decrypted = decrypt(stored);
      const parsed = JSON.parse(decrypted);
      // Note: Profile picture will be loaded asynchronously in useEffect

      return {
        firstName: parsed?.firstName || 'User',
        lastName: parsed?.lastName || '',
        systemRoleName: parsed?.systemRoleName || 'NO ROLE ASSIGNED',
        imageUrl: undefined,
      };
    } catch (error) {
      console.error('Failed to parse userDetails from localStorage:', error);
      return {
        firstName: 'User',
        lastName: '',
        systemRoleName: 'NO ROLE ASSIGNED',
      };
    }
  })());

  // Load profile picture from localStorage on mount
  useEffect(() => {
    const loadProfilePicture = async () => {
      const stored = localStorage.getItem('userDetails');
      const token = localStorage.getItem('sessionKey');

      if (!stored || !token) return;

      try {
        const decrypted = decrypt(stored);
        const parsed = JSON.parse(decrypted);
        if (parsed?.profilePictureStorageFileId) {
          const fileIdEncrypted = String(parsed.profilePictureStorageFileId);
          console.log('[ProfileDropdown] Loading profile picture from localStorage');
          const photoResponse = await getUserPhoto(fileIdEncrypted, token);
          const imageUrl = URL.createObjectURL(photoResponse.data);
          setUser(prev => ({ ...prev, imageUrl }));
          setPhotoFetched(true);
          console.log('[ProfileDropdown] Profile picture loaded from localStorage');
        }
      } catch (error) {
        console.warn('Failed to load profile picture from localStorage:', error);
      }
    };

    loadProfilePicture();

    // Listen for profile picture updates
    const handleProfilePictureUpdate = () => {
      console.log('[ProfileDropdown] Profile picture update event received');
      loadProfilePicture();
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  // Fetch user details only when landing on the dashboard
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('[ProfileDropdown] Starting to fetch user data');
      try {
        const systemUserIdEncrypted = systemUserId;
        const token = localStorage.getItem('sessionKey');

        console.log('[ProfileDropdown] Retrieved tokens:', { systemUserId: !!systemUserIdEncrypted, sessionKey: !!token });

        if (!systemUserIdEncrypted || !token) {
          console.warn('Missing tokens in localStorage');
          return;
        }

        console.log('[ProfileDropdown] Calling getCurrentUserDetails API');
        const userResponse = await getCurrentUserDetails(systemUserIdEncrypted, token);
        console.log('[ProfileDropdown] getCurrentUserDetails response:', userResponse);

        if (userResponse.data.success && userResponse.data.data) {
          const { firstName, lastName, systemRoleName, profilePictureStorageFileId } = userResponse.data.data;

          // Get profilePictureStorageFileId from localStorage if available
          const stored = localStorage.getItem('userDetails');
          let localProfilePictureStorageFileId: string | undefined;
          if (stored) {
            try {
              const decrypted = decrypt(stored);
              const parsed = JSON.parse(decrypted);
              localProfilePictureStorageFileId = parsed?.profilePictureStorageFileId;
            } catch (error) {
              console.warn('Failed to decrypt localStorage for profilePictureStorageFileId:', error);
            }
          }

          // Use localStorage value if available, otherwise from API
          const fileIdToUse = localProfilePictureStorageFileId || profilePictureStorageFileId;

          let imageUrl: string | undefined;
          if (fileIdToUse && !user.imageUrl) {
            try {
              const fileIdEncrypted = String(fileIdToUse);
              console.log('[ProfileDropdown] Calling getUserPhoto API');
              const photoResponse = await getUserPhoto(fileIdEncrypted, token);
              imageUrl = URL.createObjectURL(photoResponse.data);
              setPhotoFetched(true);
              console.log('[ProfileDropdown] getUserPhoto success');
            } catch (photoError) {
              console.warn('Failed to fetch profile picture:', photoError);
            }
          }

          const updatedUser = {
            firstName,
            lastName,
            systemRoleName: systemRoleName || 'NO ROLE ASSIGNED',
            imageUrl: imageUrl || user.imageUrl,
          };

          setUser(updatedUser);

          // Update localStorage with the latest user data including profilePictureStorageFileId
          if (stored) {
            try {
              const decrypted = decrypt(stored);
              const parsed = JSON.parse(decrypted);
              const updatedParsed = {
                ...parsed,
                profilePictureStorageFileId,
              };
              const encrypted = encrypt(JSON.stringify(updatedParsed));
              localStorage.setItem('userDetails', encrypted);
              console.log('[ProfileDropdown] Updated localStorage with profilePictureStorageFileId');
            } catch (error) {
              console.error('Failed to update localStorage:', error);
            }
          }
        } else if (propUser) {
          setUser(propUser);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (propUser) setUser(propUser);
      }
    };

    // ✅ Trigger API calls only when landing on the dashboard
    if (location.pathname.startsWith('/dashboard')) {
      console.log('[ProfileDropdown] User landed on dashboard — triggering API calls');
      fetchUserData();
    }
  }, [propUser, location.pathname, user.imageUrl, photoFetched, systemUserId]);

  const getUserEmailFromStorage = () => {
    const stored = localStorage.getItem('userDetails');
    if (!stored) return 'user@example.com';
    try {
      const decrypted = decrypt(stored);
      const parsed = JSON.parse(decrypted);
      return parsed?.email || 'user@example.com';
    } catch (error) {
      console.error('Failed to decrypt userDetails for email:', error);
      return 'user@example.com';
    }
  };

  const userEmail = getUserEmailFromStorage();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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
    if (!systemUserId) return;

    setIsFetchingProfile(true);
    try {
      const token = localStorage.getItem('sessionKey');
      if (!token) {
        console.error('No token found in localStorage');
        onNavigate?.('profile');
        return;
      }
      console.log('[ProfileDropdown] Calling getCurrentUserDetails for profile click');
      const userData = await getCurrentUserDetails(systemUserId, token);
      console.log('[ProfileDropdown] Profile click API response:', userData);
      localStorage.setItem('userProfile', JSON.stringify(userData));
      onNavigate?.('profile');
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      onNavigate?.('profile');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-slate-100"
          >
            <Avatar className="w-8 h-8 border-2 border-blue-200">
              <AvatarImage
                src={user.imageUrl || undefined}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="text-sm font-semibold text-blue-700 bg-blue-50">
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium text-slate-900 truncate max-w-32">
                {`${user.firstName} ${user.lastName}`}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-xs px-2 py-0.5 border ${getRoleBadgeColor(
                    user.systemRoleName.toLowerCase()
                  )}`}
                >
                  {user.systemRoleName.toUpperCase()}
                </Badge>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          <DropdownMenuContent align="end" className="w-64 p-2" asChild>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-3 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-blue-200">
                    <AvatarImage
                      src={user.imageUrl || undefined}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-lg font-semibold text-blue-700 bg-blue-50">
                      {getInitials(`${user.firstName} ${user.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {`${user.firstName} ${user.lastName}`}
                    </p>
                    <p className="text-xs text-slate-500 truncate">@{userEmail}</p>
                    <Badge
                      className={`text-xs px-2 py-0.5 mt-1 border ${getRoleBadgeColor(
                        user.systemRoleName.toLowerCase()
                      )}`}
                    >
                      {user.systemRoleName.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

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
