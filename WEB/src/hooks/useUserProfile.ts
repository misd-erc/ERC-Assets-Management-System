import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { getUserDetails } from '../api/authApi';
import { UserDetails } from '../types/user';
import { handleSessionExpired, getSessionToken } from '../utils/sessionUtils';

export const useUserProfile = () => {
  const { systemUserIdEncrypted } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (isMounted: boolean) => {
    // Use token from store or localStorage
    const token = systemUserIdEncrypted || getSessionToken();
    
    if (!token) {
      console.log('[useUserProfile] No token available');
      if (isMounted) setLoading(false);
      return;
    }

    try {
      console.log('[useUserProfile] Loading user profile...');
      
      // Check localStorage first
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Include profilePictureId from separate localStorage key
        const profilePictureId = localStorage.getItem('profilePictureId');
        if (profilePictureId) {
          parsed.profilePictureId = profilePictureId;
        }
        if (isMounted) {
          setUserProfile(parsed);
          setLoading(false);
        }
        console.log('[useUserProfile] Loaded from localStorage');
        return;
      }

      // Fetch from API if not in localStorage
      console.log('[useUserProfile] Fetching from API...');
      const data = await getUserDetails(token, token);

      if (isMounted) {
        // Include profilePictureId from separate localStorage key
        const profilePictureId = localStorage.getItem('profilePictureId');
        if (profilePictureId) {
          (data as any).profilePictureId = profilePictureId;
        }
        localStorage.setItem('userProfile', JSON.stringify(data));
        setUserProfile(data);
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
  }, [systemUserIdEncrypted]);

  const refreshProfile = useCallback(async () => {
    const token = systemUserIdEncrypted || getSessionToken();
    
    if (!token) {
      console.log('[useUserProfile] No token available for refresh');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[useUserProfile] Refreshing profile...');
      const data = await getUserDetails(token, token);
      localStorage.setItem('userProfile', JSON.stringify(data));
      setUserProfile(data);
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
  }, [systemUserIdEncrypted]);

  useEffect(() => {
    let isMounted = true;

    loadUserProfile(isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadUserProfile]);

  return { userProfile, loading, refreshProfile };
};
