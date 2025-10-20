import { create } from 'zustand';
import { User, AuthStore } from '../../types';
import { validateUser, validateOTP, validateSessionToken, logout as apiLogout } from '../../api/authApi';
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
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const systemUserIdEncrypted = localStorage.getItem('systemUserIdEncrypted');

    if (token && userStr && systemUserIdEncrypted) {
      try {
        set({ loading: true, error: '' });
        const user = JSON.parse(userStr);

        // Validate session token with backend
        const result = await validateSessionToken(token, systemUserIdEncrypted);

        set({
          isAuthenticated: true,
          user: { ...user, ...result.user },
          token: result.token,
          requireMFA: false,
          loading: false,
          systemUserIdEncrypted
        });

        // Update stored token if refreshed
        localStorage.setItem('authToken', result.token);
      } catch (error) {
        // Session invalid, clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('systemUserIdEncrypted');
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          requireMFA: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Session expired'
        });
      }
    }
  },

  login: async (userInfo: { entraId: string; firstName: string; lastName: string; email: string }) => {
    set({ loading: true, error: '' });

    try {
      const result = await validateUser(userInfo);

      // Store encrypted system user ID
      localStorage.setItem('systemUserIdEncrypted', result.systemUserIdEncrypted);

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
          entraId: userInfo.entraId,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName
        }
      });

      return { success: true, message: result.message };
    } catch (error) {
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

      set({
        isAuthenticated: true,
        user: updatedUser,
        token: result.token,
        requireMFA: false,
        loading: false
      });

      // Store in localStorage
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(updatedUser));

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
    apiLogout();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      requireMFA: false,
      loading: false,
      error: '',
      systemUserIdEncrypted: undefined
    });
  },
}));
