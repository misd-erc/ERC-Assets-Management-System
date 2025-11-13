import axios, { type AxiosResponse } from 'axios';
import axiosInstance from '@/lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserPublicViewModel, ApiResponse } from '@/types';

import { guidToLongId } from '@/utils/guidUtils';
import { sanitizeSystemUserId } from '@/utils/sanitizationUtils';


export interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  divisionName?: string;
  officeName?: string;
  role?: string;
  status?: string;
  profileImage?: string;
  profilePictureStorageFileId?: string;
  employeeId: string;
}

export interface EditUserPayload {
  systemUserId: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  actionBySystemUserId: string;
}

export const getUserDetails = async (): Promise<UserDetails> => {
  // Retrieve tokens directly from localStorage to ensure we use the latest synced values
  const currentSystemId = String(localStorage.getItem('systemUserId'));


  if (currentSystemId !== currentSystemId) {
    console.warn('[AuthAPI] Token mismatch detected! Syncing before API call.');
    // Auto-correct by syncing them
    if (currentSystemId) {
      localStorage.setItem('systemUserId', currentSystemId);
      console.log('[AuthAPI] Synced systemUserId with ActionBySystemUserIdEncrypted');
    }
  }

  // Get session key from localStorage
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<ApiResponse<UserDetails>>(
    `/Users/all/${encodeURIComponent(currentSystemId)}?ActionBySystemUserId=${encodeURIComponent(currentSystemId)}&SessionKey=${encodeURIComponent(sessionKey)}`
  );

  // Check for invalid session
  if (!response.data.success || response.data.code === 'ERR_SERVER') {
    throw new Error('Session expired');
  }

  return response.data.data;
};

export const editUserDetails = async (userData: {
  systemUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  actionBySystemUserId: string;
}): Promise<{ message: string }> => {
  const payload = {
    SystemUserId: userData.systemUserId,
    FirstName: userData.firstName,
    LastName: userData.lastName,
    Email: userData.email,
    ActionBySystemUserId: userData.actionBySystemUserId
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Users/edit-profile', payload);
  return { message: response.data.message };
};

export const editUserProfile = async (payload: EditUserPayload): Promise<{ message: string }> => {
  const plainPayload = {
    systemUserId: payload.systemUserId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    employeeId: payload.employeeId,
    actionBySystemUserId: payload.actionBySystemUserId
  };

  const response = await axiosInstance.patch<ApiResponse<any>>('/Users/edit', plainPayload);
  return { message: response.data.message };
};

export const validateUser = async (userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string }): Promise<{ systemUserId: string; message: string }> => {
  const payload: UserValidationViewModel = {
    entraId: guidToLongId(userInfo.entraId),
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    email: userInfo.email,
    employeeId: userInfo.employeeId || ''
  };

  console.log('[AuthAPI] validateUser - payload:', payload);

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const response = await axios.post<ApiResponse<UserPublicViewModel>>(`${baseURL}/users/validation`, payload);
  console.log('[AuthAPI] validateUser - response:', response);
  console.log('[AuthAPI] validateUser - response.data:', response.data);

  const data = response.data.data;
  console.log('[AuthAPI] validateUser - data:', data);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Validation failed');
  }

  if (!data || !data.systemUserId) {
    console.error('[AuthAPI] validateUser - Invalid response structure:', { data, systemUserId: data?.systemUserId });
    throw new Error('Invalid response from server');
  }

  return { systemUserId: data.systemUserId.toString(), message: response.data.message };
};

export const validateOTP = async (systemUserId: string, otp: string): Promise<{ systemUserId: string; sessionKey: string }> => {
  const payload: OTPValidationViewModel = {
    systemUserId: systemUserId,
    otp: otp
  };

  const response = await axiosInstance.post<ApiResponse<UserPublicViewModel>>('/users/otp/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Invalid OTP');
  }

  const sessionKey = data.sessionKey || '';

  // Save session key and systemUserId to localStorage
  localStorage.setItem('sessionToken', sessionKey);
  localStorage.setItem('systemUserId', data.systemUserId.toString());

  return { systemUserId: data.systemUserId.toString(), sessionKey };
};

export const validateSessionToken = async (token: string, systemUserId: string): Promise<{ user: User; token: string }> => {
  const payload: SessionTokenValidationViewModel = {
    Key: token,
    systemUserId: systemUserId
  };

  const response = await axiosInstance.post<ApiResponse<UserPublicViewModel>>('/users/expiry-token/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Session expired');
  }

  // Use plain user data
  const userId = data.systemUserId;
  const firstName = data.firstName || '';
  const lastName = data.lastName || '';
  const email = data.email || '';
  const newToken = data.expiryToken || '';

  const user: User = {
    id: parseInt(userId, 10),
    firstName: firstName,
    lastName: lastName,
    email: email,
    employeeId: '',
    isActive: true,
    systemRole: [],
    systemUserStatus: { id: 1, name: 'Active', isActive: true, isDeleted: false, createdAt: '' },
    office: null,
    division: null,
    profilePictureStorageFile: null,
    createdAt: '',
    lastLoginAt: ''
  };

  return { user, token: newToken };
};

export const logout = async (): Promise<void> => {
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('systemUserIdEncrypted');
  localStorage.removeItem('systemUserId');
  return Promise.resolve();
};

