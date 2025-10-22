import { User } from '../types';

export interface SessionData {
  sessionToken: string;
  systemUserIdEncrypted: string;
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
 * Retrieves systemUserIdEncrypted from localStorage
 */
export const getSystemUserIdEncrypted = (): string | null => {
  return localStorage.getItem('systemUserIdEncrypted');
};

/**
 * Saves session data to localStorage
 */
export const saveSession = (sessionData: SessionData): void => {
  localStorage.setItem('sessionToken', sessionData.sessionToken);
  localStorage.setItem('systemUserIdEncrypted', sessionData.systemUserIdEncrypted);
  localStorage.setItem('expiresAt', sessionData.expiresAt);
  localStorage.setItem('user', JSON.stringify(sessionData.user));
};

/**
 * Loads and validates session from localStorage
 * Returns null if session is invalid or expired
 */
export const loadSession = (): SessionData | null => {
  const sessionToken = localStorage.getItem('sessionToken');
  const systemUserIdEncrypted = localStorage.getItem('systemUserIdEncrypted');
  const expiresAt = localStorage.getItem('expiresAt');
  const userStr = localStorage.getItem('user');

  if (!sessionToken || !systemUserIdEncrypted || !expiresAt || !userStr) {
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
      systemUserIdEncrypted,
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
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('systemUserIdEncrypted');
  localStorage.removeItem('expiresAt');
  localStorage.removeItem('user');
};
