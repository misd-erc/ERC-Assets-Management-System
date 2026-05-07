import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { getUserDetails } from '@/api/user-management/authApi';
import { UserDetails, SystemRole, SystemRoleScope } from '@/types/user';
import { handleSessionExpired, getSessionToken } from '@/utils/sessionUtils';
import { secureStorage } from '@/utils/secureStorage';

export const useUserProfile = () => {
  const { systemUserId } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (isMounted: boolean) => {
    // Use token from store or localStorage
    const token = systemUserId || getSessionToken();

    if (!token) {
      console.log('[useUserProfile] No token available');
      if (isMounted) setLoading(false);
      return;
    }

    try {
      console.log('[useUserProfile] Fetching user profile from API...');

      // Always fetch from API to ensure latest data
      const data = await getUserDetails({ preferCache: true }) as UserDetails;

      if (isMounted) {
        // Include profilePictureId from separate localStorage key
        const profilePictureId = secureStorage.getItem('profilePictureId');
        if (profilePictureId) {
          (data as any).profilePictureId = profilePictureId;
        }
        secureStorage.setItem('userProfile', JSON.stringify(data));
        setUserProfile(data as UserDetails);
        setLoading(false);
        console.log('[useUserProfile] Profile loaded successfully');
      }
    } catch (error) {
      console.error('[useUserProfile] Failed to fetch user profile:', error);

      // Check if it's a session error
      if (error instanceof Error && error.message === 'Session expired') {
        handleSessionExpired();
      } else {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
  }, [systemUserId]);

  const refreshProfile = useCallback(async () => {
    const token = systemUserId || getSessionToken();
    
    if (!token) {
      console.log('[useUserProfile] No token available for refresh');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[useUserProfile] Refreshing profile...');
      const data = await getUserDetails({ forceRefresh: true });
      secureStorage.setItem('userProfile', JSON.stringify(data));
     setUserProfile(data as UserDetails);
      console.log('[useUserProfile] Profile refreshed successfully');
    } catch (error) {
      console.error('[useUserProfile] Failed to refresh profile:', error);
      
      // Check if it's a session error
      if (error instanceof Error && error.message === 'Session expired') {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [systemUserId]);

  useEffect(() => {
    let isMounted = true;

    loadUserProfile(isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadUserProfile]);

  return { userProfile, loading, refreshProfile };
};




