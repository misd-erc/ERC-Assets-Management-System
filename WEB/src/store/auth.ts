import { create } from 'zustand';
import { User, AuthStore, LoginCredentials } from '../types';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Temporarily disabled localStorage loading to always show login on start
  // const token = localStorage.getItem('authToken');
  // const userStr = localStorage.getItem('user');
  // const user = userStr ? JSON.parse(userStr) : null;
  // const isAuthenticated = !!token && !!user;

  isAuthenticated: false,
  user: null,
  token: null,
  requireMFA: false,
  loading: false,
  error: '',

  login: async ({ username, password }: LoginCredentials) => {
    set({ loading: true, error: '' });
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username === 'admin' && password === 'admin123') {
      const user: User = { id: '1', name: 'Admin User', email: 'admin@example.com', username: 'admin', role: 'System Administrator' };
      set({ isAuthenticated: true, user, requireMFA: true, loading: false });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } else if (username === 'user' && password === 'user') {
      const user: User = { id: '2', name: 'Regular User', email: 'user@example.com', username: 'user', role: 'user' };
      set({ isAuthenticated: true, user, requireMFA: true, loading: false });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    set({ error: 'Invalid credentials', loading: false });
    return false;
  },

  verifyMFA: async (code: string) => {
    set({ loading: true, error: '' });
    // Mock verify delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (code === '123456') {
      const token = 'mock-token-123456789';
      set({ token, requireMFA: false, loading: false });
      localStorage.setItem('authToken', token);
      return true;
    }
    set({ error: 'Invalid verification code', loading: false });
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, token: null, requireMFA: false, loading: false, error: '' });
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
}));
