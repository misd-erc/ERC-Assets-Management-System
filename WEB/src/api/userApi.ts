import axiosInstance from '../lib/axios';
import { User, ApiResponse, Office, Division, EmploymentType, Position, SystemRole } from '../types';
import { UserDetails, getUserDetails } from './authApi';
import { getAuditTrail } from './auditApi';

export interface UserListResponse {
  success: boolean;
  data: {
    items: User[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export const getUsers = async (token: string, page: number = 1, pageSize: number = 10): Promise<UserListResponse> => {
  const response = await axiosInstance.get<UserListResponse>(
    `/Users/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}&pageNumber=${page}&pageSize=${pageSize}`
  );

  // Map API response to User type
  const mappedItems = response.data.data.items.map((item: any) => ({
    id: item.id.toString(),
    name: `${item.firstName} ${item.lastName}`,
    email: item.email,
    username: item.email.split('@')[0], // Use email prefix as username
    role: item.role || 'User', // Default if not provided
    systemRoleName: item.systemRoleName || item.role || 'User',
    position: item.position || '',
    status: (item.isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive' | 'Suspended',
    department: item.department || '',
    dateCreated: item.createdAt,
    lastLogin: item.lastLoginAt,
    firstName: item.firstName,
    lastName: item.lastName,
    officeName: item.officeName,
    divisionName: item.divisionName,
    employmentTypeId: item.employmentTypeId,
    profilePictureStorageFileId: item.profilePictureStorageFileId
  }));

  return {
    ...response.data,
    data: {
      ...response.data.data,
      items: mappedItems
    }
  };
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
  const token = localStorage.getItem('systemUserIdEncrypted') || '';
  const response = await getUsers(token);
  const user = response.data.items.find(u => u.id === id);
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
export const validateUserSession = async (actionBySystemUserIdEncrypted: string): Promise<UserDetails> => {
  console.log('[UserAPI] Validating session with token');

  try {
    // Call getUserDetails which internally calls /Users/all/{token}?ActionBySystemUserIdEncrypted={token}
    const userDetails = await getUserDetails(actionBySystemUserIdEncrypted, actionBySystemUserIdEncrypted);

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

export const editUser = async (payload: {
  systemUserIdEncrypted: string;
  systemRoleIdEncrypted?: string;
  officeIdEncrypted?: string;
  divisionIdEncrypted?: string;
  employmentTypeIdEncrypted?: string;
  positionIdEncrypted?: string;
  statusIdEncrypted?: string;
  isActiveEncrypted?: string;
  actionBySystemUserIdEncrypted: string;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.post<ApiResponse<any>>('/Users/edit', payload);
  return { message: response.data.message };
};

export const getOffices = async (token: string): Promise<Office[]> => {
  const response = await axiosInstance.get<{ data: { items: Office[] } }>(
    `/Office/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`
  );
  return Array.isArray(response.data.data.items) ? response.data.data.items : [];
};

export const getDivisions = async (token: string): Promise<Division[]> => {
  const response = await axiosInstance.get<{ data: { items: Division[] } }>(
    `/Office/division/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`
  );
  return Array.isArray(response.data.data.items) ? response.data.data.items : [];
};

export const getEmploymentTypes = async (token: string): Promise<EmploymentType[]> => {
  const response = await axiosInstance.get<{ data: { items: EmploymentType[] } }>(
    `/Office/employment-type/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`
  );
  return Array.isArray(response.data.data.items) ? response.data.data.items : [];
};

export const getPositions = async (token: string): Promise<Position[]> => {
  const response = await axiosInstance.get<{ data: { items: Position[] } }>(
    `/Office/position/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`
  );
  return Array.isArray(response.data.data.items) ? response.data.data.items : [];
};

export const getSystemRoles = async (token: string): Promise<SystemRole[]> => {
  const response = await axiosInstance.get<{ data: { items: SystemRole[] } }>(
    `/Users/system-role/all?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`
  );
  return Array.isArray(response.data.data.items) ? response.data.data.items : [];
};

/**
 * Get user details for the current logged-in user
 * @param systemUserIdEncrypted - The encrypted system user ID
 * @param token - The action by system user ID encrypted (token)
 * @returns Axios promise for user details
 */
export const getCurrentUserDetails = async (systemUserIdEncrypted: string, token: string) => {
  return axiosInstance.get(`/Users/all/${encodeURIComponent(systemUserIdEncrypted)}?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`);
};

/**
 * Retrieve user profile picture
 * @param fileIdEncrypted - The encrypted file storage ID
 * @param token - The action by system user ID encrypted (token)
 * @returns Promise with blob response for the profile picture
 */
export const getUserPhoto = async (fileIdEncrypted: string, token: string) => {
  const response = await axiosInstance.get(
    `/Storage/retrieve/${encodeURIComponent(fileIdEncrypted)}?ActionBySystemUserIdEncrypted=${encodeURIComponent(token)}`,
    { responseType: 'blob' }
  );
  return response;
};


