import axiosInstance from '../lib/axios';
import { User, ApiResponse } from '../types';
import { getUserDetails, UserDetails } from './authApi';
import { getAuditTrail } from './auditApi';

export const getUsers = async (): Promise<User[]> => {
  // const response = await axiosInstance.get('/users');
  // return response.data;

  // Mock implementation
  return [
    { id: '1', name: 'Admin User', email: 'admin@example.com', username: 'admin', role: 'System Administrator' },
    { id: '2', name: 'Regular User', email: 'user@example.com', username: 'user', role: 'user' },
  ];
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  // const response = await axiosInstance.post('/users', user);
  // return response.data;

  // Mock implementation
  const newUser: User = { ...user, id: Date.now().toString() };
  return newUser;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  // const response = await axiosInstance.put(`/users/${id}`, updates);
  // return response.data;

  // Mock implementation
  const user = await getUsers().then(users => users.find(u => u.id === id));
  if (!user) throw new Error('User not found');
  return { ...user, ...updates };
};

export const deleteUser = async (id: string): Promise<void> => {
  // await axiosInstance.delete(`/users/${id}`);

  // Mock implementation
  return Promise.resolve();
};

/**
 * Validate user session by calling the Users/all API
 * This is used to check if the token is still valid
 *
 * @param systemUserIdEncrypted - The encrypted system user ID (token)
 * @returns Promise<UserDetails> - User details if session is valid
 * @throws Error if session is invalid or expired
 */
export const validateUserSession = async (systemUserIdEncrypted: string): Promise<UserDetails> => {
  console.log('[UserAPI] Validating session with token');

  try {
    // Call getUserDetails which internally calls /Users/all/{token}?ActionBySystemUserIdEncrypted={token}
    const userDetails = await getUserDetails(systemUserIdEncrypted, systemUserIdEncrypted);

    console.log('[UserAPI] Session validation successful');
    return userDetails;
  } catch (error) {
    console.error('[UserAPI] Session validation failed:', error);
    throw error;
  }
};

/**
 * Get audit trail for the current user
 * @param systemUserIdEncrypted - The encrypted system user ID (token)
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<AuditTrailResponse>
 */
export const getUserAuditTrail = async (systemUserIdEncrypted: string, page: number = 1, pageSize: number = 10) => {
  return getAuditTrail(systemUserIdEncrypted, page, pageSize);
};
