import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSessionValid, handleSessionExpired, getSessionToken } from '../utils/sessionUtils';
import { getUserDetails } from '../api/authApi';

/**
 * Session Guard Hook
 * Validates user session on mount and redirects to login if invalid
 * Use this hook in protected routes/components to ensure user is authenticated
 * 
 * @param validateWithBackend - If true, validates token with backend API (default: false)
 * @returns Object containing loading state and session validity
 */
export const useSessionGuard = (validateWithBackend: boolean = false) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      console.log('[SessionGuard] Validating session...');

      // First check if token exists in localStorage
      if (!isSessionValid()) {
        console.log('[SessionGuard] No valid token found in localStorage');
        handleSessionExpired('Please log in to continue.');
        setLoading(false);
        setIsValid(false);
        return;
      }

      const token = getSessionToken();
      console.log('[SessionGuard] Token found:', token ? 'Yes' : 'No');

      // If backend validation is requested, call the API
      if (validateWithBackend && token) {
        try {
          console.log('[SessionGuard] Validating token with backend...');
          
          // Call the Users/all API to validate the token
          await getUserDetails(token, token);
          
          console.log('[SessionGuard] Token validated successfully');
          setIsValid(true);
        } catch (error) {
          console.error('[SessionGuard] Token validation failed:', error);
          
          // If validation fails, clear session and redirect
          handleSessionExpired('Your session has expired. Please log in again.');
          setIsValid(false);
        } finally {
          setLoading(false);
        }
      } else {
        // If no backend validation, just check localStorage
        console.log('[SessionGuard] Session valid (localStorage check only)');
        setIsValid(true);
        setLoading(false);
      }
    };

    validateSession();
  }, [validateWithBackend, navigate]);

  return { loading, isValid };
};

/**
 * Simple hook to check if user is authenticated
 * Does not perform backend validation, only checks localStorage
 * 
 * @returns boolean indicating if user has a valid token
 */
export const useIsAuthenticated = (): boolean => {
  return isSessionValid();
};

/**
 * Hook to get the current session token
 * 
 * @returns The session token or null if not found
 */
export const useSessionToken = (): string | null => {
  return getSessionToken();
};
