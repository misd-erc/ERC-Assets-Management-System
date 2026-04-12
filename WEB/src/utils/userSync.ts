import { getUserDetails } from '@/api/user-management/authApi';
import { encrypt } from '@/utils/encryption';
import { secureStorage } from './secureStorage';

let syncInterval: NodeJS.Timeout | null = null;

export const initUserSync = () => {
  // Clear any existing interval
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Function to sync user details
  const syncUserDetails = async () => {
    try {
      const systemUserId = secureStorage.getItem('systemUserId');
      const sessionToken = secureStorage.getItem('sessionToken');

      // Check if required tokens exist
      if (!systemUserId || !sessionToken) {
        console.warn('[UserSync] Missing systemUserId or sessionToken, skipping sync');
        return;
      }

      // Call API to get fresh user details
      const userDetails = await getUserDetails();

      // Encrypt and save to localStorage
      const encryptedDetails = encrypt(JSON.stringify(userDetails));
      secureStorage.setItem('userDetails', encryptedDetails);

      console.log('[UserSync] Updated from API');
    } catch (error) {
      if (error instanceof Error && error.message === 'Session expired') {
        console.log('[UserSync] Session expired');
        // Clear userDetails on session expiry
        secureStorage.removeItem('userDetails');
      } else {
        console.error('[UserSync] Sync failed:', error);
      }
    }
  };

  // Initial sync on page load
  syncUserDetails();

  // Set up interval for every 10 minutes (600,000 ms)
  syncInterval = setInterval(syncUserDetails, 600000);
};

// Function to stop syncing (useful for cleanup)
export const stopUserSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
