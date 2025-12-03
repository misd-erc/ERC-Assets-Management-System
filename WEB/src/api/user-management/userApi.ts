import axiosInstance from '@/lib/axios';
import { User, ApiResponse, Office, Division, EmploymentType, Position, SystemRole } from '@/types';
import { Employee, ApiEmployee } from '@/types/asset/UnifiedAsset';
import { UserDetails, getUserDetails } from '@/api/user-management/authApi';
import { getAuditTrail } from '@/api/audit/auditApi';

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

export const getUsers = async (page: number = 1, pageSize: number = 10): Promise<UserListResponse> => {
  // Get system user ID and session key from localStorage
  const systemUserId = localStorage.getItem('systemUserId') || '';
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<UserListResponse>(
    `/Users/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}&pageNumber=${page}&pageSize=${pageSize}`
  );

  // Map API response to User type
  const mappedItems = response.data.data.items.map((item: any) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    employeeId: item.employeeId,
    isActive: item.isActive,
    systemRole: item.systemRole || [],
    systemUserStatus: item.systemUserStatus || { id: 1, name: 'Active', isActive: true, isDeleted: false, createdAt: '' },
    office: item.office || null,
    division: item.division || null,
    employmentType: item.employmentType || null,
    position: item.position || null,
    profilePictureStorageFile: item.profilePictureStorageFile || null,
    createdAt: item.createdAt,
    lastLoginAt: item.lastLoginAt
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
  const newUser: User = { ...user, id: Date.now() };
  return newUser;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  // const response = await axiosInstance.put(`/users/${id}`, updates);
  // return response.data;

  // Mock implementation
  const response = await getUsers();
  const user = response.data.items.find(u => u.id === parseInt(id, 10));
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
 * @returns Promise<UserDetails> - User details if session is valid
 * @throws Error if session is invalid or expired
 */
export const validateUserSession = async (): Promise<UserDetails> => {
  console.log('[UserAPI] Validating session with token');

  try {
    // Call getUserDetails which internally calls /Users/all/{token}?ActionBySystemUserIdEncrypted={token}
    const userDetails = await getUserDetails();

    console.log('[UserAPI] Session validation successful');
    return userDetails;
  } catch (error) {
    console.error('[UserAPI] Session validation failed:', error);
    throw error;
  }
};

/**
 * Get audit trail for the current user
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<AuditTrailResponse>
 */
export const getUserAuditTrail = async (page: number = 1, pageSize: number = 10) => {
  // Get system user ID and session key from localStorage
  const systemUserId = localStorage.getItem('systemUserId') || '';
  const sessionKey = localStorage.getItem('sessionToken') || '';

  return getAuditTrail(systemUserId, sessionKey, page, pageSize);
};

export const editUser = async (payload: {
  systemUserId: number;
  systemRoleId?: number;
  officeId?: number;
  divisionId?: number;
  employmentTypeId?: number;
  positionId?: number;
  statusId?: number;
  isActive: boolean;
  actionBySystemUserId: number;
}): Promise<{ message: string }> => {
  const sessionKey = localStorage.getItem('sessionToken') || '';
  const systemUserId = localStorage.getItem('systemUserId') || '';
  const requestPayload = {

      systemUserId: payload.systemUserId,
      systemRoleId: payload.systemRoleId,
      officeId: payload.officeId,
      divisionId: payload.divisionId,
      employmentTypeId: payload.employmentTypeId,
      positionId: payload.positionId,
      statusId: payload.statusId,
      isActive: payload.isActive,
      actionBySystemUserId: systemUserId,
      sessionKey: sessionKey
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Users/edit', requestPayload);
  return { message: response.data.message };
};

// export const getOffices = async (): Promise<Office[]> => {
//   // Get system user ID from localStorage
//   const systemUserId = localStorage.getItem('systemUserId') || '';
// const sessionKey = localStorage.getItem('sessionToken') || '';
//   const response = await axiosInstance.get<{ data: { items: Office[] } }>(
//     `/Office/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`
//   );
//   return Array.isArray(response.data.data.items) ? response.data.data.items : [];
// };

// export const getDivisions = async (): Promise<Division[]> => {
//   // Get system user ID from localStorage
//   const systemUserId = localStorage.getItem('systemUserId') || '';
// const sessionKey = localStorage.getItem('sessionToken') || '';
//   const response = await axiosInstance.get<{ data: { items: Division[] } }>(
//     `/Office/division/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`
//   );
//   return Array.isArray(response.data.data.items) ? response.data.data.items : [];
// };

// export const getEmploymentTypes = async (): Promise<EmploymentType[]> => {
//   // Get system user ID from localStorage
//   const systemUserId = localStorage.getItem('systemUserId') || '';
// const sessionKey = localStorage.getItem('sessionToken') || '';
//   const response = await axiosInstance.get<{ data: { items: EmploymentType[] } }>(
//     `/Office/employment-type/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`
//   );
//   return Array.isArray(response.data.data.items) ? response.data.data.items : [];
// };

// export const getPositions = async (): Promise<Position[]> => {
//   // Get system user ID from localStorage
//   const systemUserId = localStorage.getItem('systemUserId') || '';
// const sessionKey = localStorage.getItem('sessionToken') || '';
//   const response = await axiosInstance.get<{ data: { items: Position[] } }>(
//     `/Office/position/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`
//   );
//   return Array.isArray(response.data.data.items) ? response.data.data.items : [];
// };



/**
 * Get user details for the current logged-in user
 * @param systemUserIdEncrypted - The encrypted system user ID
 * @param token - The action by system user ID encrypted (token)
 * @returns Axios promise for user details
 */
/**
 * Retrieve user profile picture
 * @param fileId - The file storage ID (not encrypted)
 * @param userId - The system user ID
 * @returns Promise with blob response for the profile picture
 */
export const getUserPhoto = async (fileId: string, userId: string) => {
  // Get session key from localStorage
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get(
    `/Storage/retrieve/${fileId}?ActionBySystemUserId=${encodeURIComponent(userId)}&SessionKey=${encodeURIComponent(sessionKey)}`,
    { responseType: 'blob' }
  );
  return response;
};



export const getUsersDetails = async (userId: string): Promise<UserDetails> => {
  // Retrieve tokens directly from localStorage to ensure we use the latest synced values
  const currentSystemId = String(localStorage.getItem('systemUserId'));


  if (currentSystemId !== currentSystemId) {
    console.warn('[AuthAPI] Token mismatch detected! Syncing before API call.');
    // Auto-correct by syncing them
    if (userId) {
      localStorage.setItem('systemUserId', currentSystemId);
      console.log('[AuthAPI] Synced systemUserId with ActionBySystemUserIdEncrypted');
    }
  }

  // Get session key from localStorage
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<ApiResponse<UserDetails>>(
    `/Users/all/${encodeURIComponent(userId)}?ActionBySystemUserId=${encodeURIComponent(currentSystemId)}&SessionKey=${encodeURIComponent(sessionKey)}`
  );

  // Check for invalid session
  if (!response.data.success || response.data.code === 'ERR_SERVER') {
    throw new Error('Session expired');
  }

  return response.data.data;
};

export const getEmployees = async (page: number = 1, pageSize: number = 1000): Promise<ApiResponse<{ items: ApiEmployee[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>> => {
  const systemUserId = localStorage.getItem('systemUserId') || '';
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<ApiResponse<{ items: ApiEmployee[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>(
    `/Users/employees/all?ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}&pageNumber=${page}&pageSize=${pageSize}`
  );

  return response.data;
};







