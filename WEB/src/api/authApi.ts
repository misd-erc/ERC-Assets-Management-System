import axiosInstance from '../lib/axios';
import { User, LoginCredentials } from '../types';

export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string; requireMFA: boolean }> => {
  // const response = await axiosInstance.post('/auth/login', credentials);
  // return response.data;

  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

  if (credentials.username === 'admin' && credentials.password === 'admin123') {
    return {
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', username: 'admin', role: 'System Administrator' },
      token: 'mock-token-123456789',
      requireMFA: true
    };
  } else if (credentials.username === 'user' && credentials.password === 'user') {
    return {
      user: { id: '2', name: 'Regular User', email: 'user@example.com', username: 'user', role: 'user' },
      token: 'mock-token-123456789',
      requireMFA: true
    };
  }
  throw new Error('Invalid credentials');
};

export const verifyMFA = async (code: string): Promise<{ token: string }> => {
  // const response = await axiosInstance.post('/auth/verify-mfa', { code });
  // return response.data;

  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));

  if (code === '123456') {
    return { token: 'mock-token-123456789' };
  }
  throw new Error('Invalid verification code');
};

export const logout = async (): Promise<void> => {
  // await axiosInstance.post('/auth/logout');

  // Mock implementation
  return Promise.resolve();
};
