import { create } from 'zustand';
import { User, AuthStore } from '../../types';
import { validateUser, validateOTP, validateSessionToken, logout as apiLogout, getUserDetails } from '../../api/authApi';
import { generateSessionToken, saveSession, loadSession, clearSession as clearAuthSession } from '../../services/authService';
import { clearSession, setSessionToken, getSessionToken, syncSessionIds } from '../../utils/sessionUtils';
import { toast } from 'sonner';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initialize from localStorage
  isAuthenticated: false,
  user: null,
  token: null,
  requireMFA: false,
  loading: false,
  error: '',
  systemUserIdEncrypted: undefined,

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
        if (!storedUserDetails && session.systemUserIdEncrypted) {
          console.log('[AuthStore] Fetching user details...');
          // Fetch user details if not present
          const userDetails = await getUserDetails(session.systemUserIdEncrypted, session.systemUserIdEncrypted);
          localStorage.setItem('userDetails', JSON.stringify(userDetails));
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
          systemUserIdEncrypted: session.systemUserIdEncrypted
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

  login: async (userInfo: { entraId: string; firstName: string; lastName: string; email: string }) => {
    set({ loading: true, error: '' });

    try {
      console.log('[AuthStore] Validating user...');
      const result = await validateUser(userInfo);

      // Store user data in localStorage first
      const tempUser = {
        id: result.systemUserIdEncrypted, // Temporary ID, will be updated after MFA
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        email: userInfo.email,
        username: userInfo.email,
        role: 'user',
        systemRoleName: 'user',
        entraId: userInfo.entraId,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
      };
      localStorage.setItem('user', JSON.stringify(tempUser));

      // Store encrypted system user ID using centralized utility (will use user.id from localStorage)
      setSessionToken();

      set({
        requireMFA: true,
        loading: false,
        systemUserIdEncrypted: result.systemUserIdEncrypted,
        user: {
          id: '', // Will be set after OTP validation
          name: `${userInfo.firstName} ${userInfo.lastName}`,
          email: userInfo.email,
          username: userInfo.email,
          role: 'user',
          systemRoleName: 'user',
          entraId: userInfo.entraId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        }
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

    const { systemUserIdEncrypted } = get();
    if (!systemUserIdEncrypted) {
      set({ error: 'No system user ID available', loading: false });
      return false;
    }

    try {
      const result = await validateOTP(systemUserIdEncrypted, code);

      // Update user with decrypted data
      const updatedUser: User = {
        ...result.user,
        entraId: get().user?.entraId || '' // Preserve Entra ID from MSAL
      };

      // Fetch and store user details
      const userDetails = await getUserDetails(systemUserIdEncrypted, systemUserIdEncrypted);
      localStorage.setItem('userDetails', JSON.stringify(userDetails));

      // Generate session token and set expiration (1 day from now)
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day

      // Save session to localStorage
      saveSession({
        sessionToken,
        systemUserIdEncrypted: result.systemUserIdEncrypted,
        expiresAt,
        user: updatedUser
      });

      set({
        isAuthenticated: true,
        user: updatedUser,
        token: sessionToken, // Store session token in state
        requireMFA: false,
        loading: false
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
    const { token, systemUserIdEncrypted } = get();
    if (!token || !systemUserIdEncrypted) {
      return false;
    }

    try {
      set({ loading: true, error: '' });
      const result = await validateSessionToken(token, systemUserIdEncrypted);

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
      systemUserIdEncrypted: undefined
    });
    
    console.log('[AuthStore] Logout complete');
  },
}));
