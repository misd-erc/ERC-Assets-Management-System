import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  requireMFA: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  requireMFA: false,

  login: async ({ username, password }) => {
    // Mock login logic
    if (username === 'admin' && password === 'admin') {
      set({ isAuthenticated: true, user: { id: '1', name: 'Admin User', email: 'admin@example.com', username: 'admin', role: 'admin' }, requireMFA: true });
      return true;
    } else if (username === 'user' && password === 'user') {
      set({ isAuthenticated: true, user: { id: '2', name: 'Regular User', email: 'user@example.com', username: 'user', role: 'user' }, requireMFA: true });
      return true;
    }
    return false;
  },

  verifyMFA: async (code: string) => {
    if (code === '123456') {
      set({ requireMFA: false });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, requireMFA: false });
  },
}));
