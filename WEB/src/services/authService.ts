import { User } from '@/types';
import { sanitizeSystemUserId } from '@/utils/sanitizationUtils';
import { secureStorage } from '@/utils/secureStorage';

export interface SessionData {
  sessionToken: string;
  systemUserId: string;
  expiresAt: string;
  user: User;
}

/**
 * Generates a random session token (UUID v4)
 */
export const generateSessionToken = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Retrieves systemUserId from localStorage
 */
export const getSystemUserId = (): string | null => {
  return secureStorage.getItem('systemUserId');
};

/**
 * Saves session data to localStorage
 */
export const saveSession = (sessionData: SessionData): void => {
  // Ensure user.id matches systemUserId
  const updatedUser = {
    ...sessionData.user,
    id: sessionData.systemUserId
  };
  secureStorage.setItem('sessionToken', sessionData.sessionToken);
  secureStorage.setItem('systemUserId', sessionData.systemUserId);
  secureStorage.setItem('expiresAt', sessionData.expiresAt);
  secureStorage.setItem('user', JSON.stringify(updatedUser));
};

/**
 * Loads and validates session from localStorage
 * Returns null if session is invalid or expired
 */
export const loadSession = (): SessionData | null => {
  const sessionToken = secureStorage.getItem('sessionToken');
  const systemUserId = secureStorage.getItem('systemUserId');
  const expiresAt = secureStorage.getItem('expiresAt');
  const userStr = secureStorage.getItem('user');

  if (!sessionToken || !systemUserId || !expiresAt || !userStr) {
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    const expiresAtDate = new Date(expiresAt);
    const now = new Date();

    // Check if session is expired
    if (expiresAtDate <= now) {
      clearSession();
      return null;
    }

    return {
      sessionToken,
      systemUserId: systemUserId,
      expiresAt,
      user
    };
  } catch (error) {
    // Invalid JSON or other error, clear session
    clearSession();
    return null;
  }
};

/**
 * Clears all session data from localStorage
 */
export const clearSession = (): void => {
  secureStorage.removeItem('sessionToken');
  secureStorage.removeItem('systemUserIdEncrypted');
  secureStorage.removeItem('systemUserId');
  secureStorage.removeItem('ActionBySystemUserIdEncrypted');
  secureStorage.removeItem('ActionBySystemUserId');
  secureStorage.removeItem('expiresAt');
  secureStorage.removeItem('user');
};




