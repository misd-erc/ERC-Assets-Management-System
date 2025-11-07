import { create } from 'zustand';
import { User, AuthStore } from '../../types';
import { validateUser, validateOTP, validateSessionToken, logout as apiLogout, getUserDetails } from '../../api/user-management/authApi';
import { generateSessionToken, saveSession, loadSession, clearSession as clearAuthSession } from '../../services/authService';
import { clearSession, setSessionToken, syncSessionIds, setSessionKey, getSessionToken } from '../../utils/sessionUtils';
import { encrypt, decrypt } from '../../utils/encryption';
import { toast } from 'sonner';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initialize from localStorage
  isAuthenticated: false,
  user: null,
  token: null,
  requireMFA: false,
  loading: false,
  error: '',
  systemUserId: undefined,
  plainSystemUserId: undefined,

  // Initialize auth state on app start
  initialize: async () => {
    console.log('[AuthStore] Initializing auth state...');

    // Sync session IDs on app initialization
    syncSessionIds();

    // Load session from localStorage
    const session = loadSession();
    const token = getSessionToken();

    if (session && token) {
      try {
        set({ loading: true, error: '' });

        console.log('[AuthStore] Session found, validating...');

        // Check if userDetails exist in localStorage
        const storedUserDetails = localStorage.getItem('userDetails');
        if (!storedUserDetails && session.systemUserId) {
          console.log('[AuthStore] Fetching user details...');
          // Fetch user details if not present
          const userDetails = await getUserDetails();
          const encryptedUserDetails = encrypt(JSON.stringify(userDetails));
          localStorage.setItem('userDetails', encryptedUserDetails);

          // Check user access after fetching details
          const { checkUserAccess } = await import('../../utils/auth');
          checkUserAccess();
        }

        // Validate session token with backend (optional, can be removed if not needed)
        // For now, we'll trust the local session if it's not expired
        // const result = await validateSessionToken(session.sessionToken, session.systemUserIdEncrypted);

        set({
          isAuthenticated: true,
          user: session.user,
          token: session.sessionToken,
          requireMFA: false,
          loading: false,
          systemUserId: session.systemUserId
        });

        console.log('[AuthStore] Auth state initialized successfully');
      } catch (error) {
        console.error('[AuthStore] Session validation failed:', error);

        // Session invalid, clear storage using centralized utility
        clearSession();
        clearAuthSession();

        set({
          isAuthenticated: false,
          user: null,
          token: null,
          requireMFA: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Session expired'
        });
      }
    } else {
      console.log('[AuthStore] No session found');
      // No token, redirect to login
      set({ loading: false });
    }
  },

  login: async (userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string }) => {
    set({ loading: true, error: '' });

    try {
      console.log('[AuthStore] Validating user...');
      const result = await validateUser(userInfo);

      localStorage.setItem('systemUserId', JSON.stringify(result.systemUserId));

      setSessionToken();

      set({
        requireMFA: true,
        loading: false,
        systemUserId: result.systemUserId,
      });

      console.log('[AuthStore] User validated, MFA required');
      return { success: true, message: result.message };
    } catch (error) {
      console.error('[AuthStore] Login failed:', error);
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false
      });
      return { success: false, message: error instanceof Error ? error.message : 'Invalid response from server' };
    }
  },

  verifyMFA: async (code: string) => {
    set({ loading: true, error: '' });

    const { systemUserId } = get();
    if (!systemUserId) {
      set({ error: 'No system user ID available', loading: false });
      return false;
    }

    try {
      const result = await validateOTP(systemUserId, code);

      // Fetch and store user details
      const userDetails = await getUserDetails();
      const encryptedUserDetails = encrypt(JSON.stringify(userDetails));
      localStorage.setItem('userDetails', encryptedUserDetails);

      // Use the sessionKey from the API response instead of generating a random one
      const sessionToken = result.sessionKey;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day

      // Create user object from userDetails
      const updatedUser: User = {
        id: userDetails.id.toString(),
        name: `${userDetails.firstName} ${userDetails.lastName}`,
        email: userDetails.email,
        username: userDetails.email,
        role: 'user',
        systemRoleName: 'user',
        entraId: get().user?.entraId || '', // Preserve Entra ID from MSAL
        firstName: userDetails.firstName,
        lastName: userDetails.lastName
      };

      // Save session to localStorage
      saveSession({
        sessionToken,
        systemUserId: result.systemUserId,
        expiresAt,
        user: updatedUser
      });

      // Store the session key using the utility function
      setSessionKey(sessionToken);

      // Remove user from localStorage as requested
      localStorage.removeItem('user');

      set({
        isAuthenticated: true,
        user: updatedUser,
        token: sessionToken, // Store session token in state
        requireMFA: false,
        loading: false,
        plainSystemUserId: result.systemUserId
      });

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'OTP verification failed',
        loading: false
      });
      return false;
    }
  },

  validateSession: async () => {
    const { token, systemUserId } = get();
    if (!token || !systemUserId) {
      return false;
    }

    try {
      set({ loading: true, error: '' });
      const result = await validateSessionToken(token, systemUserId);

      const updatedUser: User = {
        ...get().user!,
        ...result.user
      };

      set({
        isAuthenticated: true,
        user: updatedUser,
        token: result.token,
        requireMFA: false,
        loading: false
      });

      // Update stored token
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update session token using the correct user.id
      setSessionToken();

      return true;
    } catch (error) {
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        requireMFA: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Session validation failed'
      });
      return false;
    }
  },

  logout: () => {
    console.log('[AuthStore] Logging out...');
    
    // Clear all session data using centralized utilities
    clearSession();
    clearAuthSession();
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      requireMFA: false,
      loading: false,
      error: '',
      systemUserId: undefined
    });
    
    console.log('[AuthStore] Logout complete');
  },
}));
