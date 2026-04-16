import { toast } from 'sonner';
import { sanitizeSystemUserId } from '@/utils/sanitizationUtils';
import { secureStorage } from './secureStorage';

/**
 * Session Management Utilities
 * Centralized functions for handling user sessions, token validation, and logout
 */

/**
 * Get the session token from localStorage
 * @returns The systemUserId token or null if not found
 */
export const getSessionToken = (): string | null => {
  return secureStorage.getItem('systemUserId');
};

/**
 * Check if a valid session token exists
 * @returns true if token exists, false otherwise
 */
export const isSessionValid = (): boolean => {
  const token = getSessionToken();
  return token !== null && token.trim() !== '';
};

/**
 * Clear all session data from localStorage
 * Removes all user-related data including tokens, profile, and user details
 */
export const clearSession = (): void => {
  // Clear all possible session-related items
  const sessionKeys = [
    'systemUserId',
    'userDetails',
    'sessionToken',
    'expiresAt',
    'employeeId'
  ];

  sessionKeys.forEach(key => {
    secureStorage.removeItem(key);
  });

  console.log('[Session] All session data cleared');
};

/**
 * Redirect user to login page with session expired message
 * Shows a toast notification and performs redirect
 * @param message Optional custom message to display
 */
export const redirectToLogin = (message: string = 'Your session has expired. Please log in again.'): void => {
  // Show toast notification
  toast.error(message, {
    duration: 3000,
    position: 'top-center',
  });

  console.log('[Session] Redirecting to login:', message);

  // Small delay to ensure toast is visible before redirect
  setTimeout(() => {
    window.location.href = '/';
  }, 500);
};

/**
 * Handle session expiration
 * Clears session data and redirects to login
 * @param message Optional custom message
 */
export const handleSessionExpired = (message?: string): void => {
  clearSession();
  redirectToLogin(message);
};

/**
 * Validate if the response indicates a session error
 * @param response API response object
 * @returns true if session is invalid, false otherwise
 */
export const isSessionError = (response: any): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const message = typeof response.message === 'string' ? response.message.toLowerCase() : '';

  // Check for explicit session error indicators
  return (
    response.code === 'ERR_SERVER' ||
    response.code === 'ERR_UNAUTHORIZED' ||
    response.code === 'ERR_SESSION_EXPIRED' ||
    response.code === 'ERR_TOKEN_EXPIRED' ||
    message.includes('session expired') ||
    message.includes('token expired') ||
    message.includes('invalid token')
  );
};

/**
 * Store session token in localStorage using user.id from localStorage
 * Always uses the correct user ID from the user object
 */
export const setSessionToken = (): void => {
  try {
    const userRaw = secureStorage.getItem('user');
    const parsedUser = userRaw ? JSON.parse(userRaw) : null;
    const userId = typeof parsedUser?.id === 'string' ? parsedUser.id.trim() : null;

    if (userId) {
      secureStorage.setItem('systemUserId', userId);
      console.log('[Session] Token updated from user.id');
    } else {
      console.warn('[Session] No valid user.id found, keeping previous token');
    }
  } catch (error) {
    console.error('[Session] Failed to update session token:', error);
  }
};

/**
 * Sync systemUserId with ActionBySystemUserId
 * Ensures both tokens are identical, using ActionBySystemUserId as the source of truth
 */
export const syncSessionIds = (): void => {
  const systemId = secureStorage.getItem('systemUserId');
  const actionId = secureStorage.getItem('ActionBySystemUserId');

  if (actionId && systemId !== actionId) {
    secureStorage.setItem('systemUserId', actionId);
    console.log('[Session] Synced systemUserId with ActionBySystemUserId');
  }
};

/**
 * Store the session key in localStorage
 * @param sessionKey The session key to store
 */
export const setSessionKey = (sessionKey: string): void => {
  secureStorage.setItem('sessionToken', sessionKey);
  console.log('[Session] Session key stored in localStorage');
};

/**
 * Check if the session has expired
 * @returns true if session is expired or invalid, false otherwise
 */
export const isSessionExpired = (): boolean => {
  const expiresAt = secureStorage.getItem('expiresAt');
  if (!expiresAt) {
    return true; // No expiration time means invalid session
  }

  try {
    const expiresAtDate = new Date(expiresAt);
    const now = new Date();
    return expiresAtDate <= now;
  } catch (error) {
    console.error('[Session] Error checking session expiration:', error);
    return true; // If parsing fails, consider expired
  }
};

/**
 * Get all session data for debugging
 * @returns Object containing all session-related localStorage items
 */
export const getSessionDebugInfo = (): Record<string, string | null> => {
  return {
    systemUserId: secureStorage.getItem('systemUserId'),
    userProfile: secureStorage.getItem('userProfile'),
    userDetails: secureStorage.getItem('userDetails'),
    token: secureStorage.getItem('token'),
    authToken: secureStorage.getItem('authToken'),
    user: secureStorage.getItem('user'),
    sessionToken: secureStorage.getItem('sessionToken'),
    expiresAt: secureStorage.getItem('expiresAt'),
  };
};

