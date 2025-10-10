import axiosInstance from '../lib/axios';
import { User } from '../types';

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
