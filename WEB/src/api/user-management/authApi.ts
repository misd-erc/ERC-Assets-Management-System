// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { type AxiosResponse } from 'axios';
import axiosInstance from '@/lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, ResendOTPViewModel, SessionTokenValidationViewModel, UserPublicViewModel, ApiResponse } from '@/types';

import { guidToLongId } from '@/utils/guidUtils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sanitizeSystemUserId } from '@/utils/sanitizationUtils';
import { secureStorage } from '@/utils/secureStorage';

export type LoginAccountType = 'system' | 'employee';


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
  const currentSystemId = String(secureStorage.getItem('systemUserId'));

  // Get session key from localStorage
  const sessionKey = secureStorage.getItem('sessionToken') || '';

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

const validateUserByType = async (
  userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string },
  accountType: LoginAccountType
): Promise<{ systemUserId: string; message: string; employeeDbId: number }> => {
  const payload: UserValidationViewModel = {
    entraId: guidToLongId(userInfo.entraId),
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    email: userInfo.email,
    employeeId: userInfo.employeeId || ''
  };

  console.log('[AuthAPI] validateUserByType - payload:', payload);

  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const endpoint = accountType === 'employee' ? '/employee/validation' : '/users/validation';
  const response = await axios.post<ApiResponse<UserPublicViewModel>>(`${baseURL}${endpoint}`, payload);
  console.log('[AuthAPI] validateUserByType - response:', response);
  console.log('[AuthAPI] validateUserByType - response.data:', response.data);

  const data = response.data.data;
  console.log('[AuthAPI] validateUserByType - data:', data);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Validation failed');
  }

  if (!data || !data.systemUserId) {
    console.error('[AuthAPI] validateUserByType - Invalid response structure:', { data, systemUserId: data?.systemUserId });
    throw new Error('Invalid response from server');
  }

  return { systemUserId: data.systemUserId.toString(), message: response.data.message, employeeDbId: data.employeeDbId ?? 0 };
};

export const validateUser = async (userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string }): Promise<{ systemUserId: string; message: string; employeeDbId: number }> => {
  return validateUserByType(userInfo, 'system');
};

export const validateEmployeeUser = async (userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string }): Promise<{ systemUserId: string; message: string; employeeDbId: number }> => {
  return validateUserByType(userInfo, 'employee');
};

export const resendOTP = async (systemUserId: string): Promise<{ message: string }> => {
  const payload: ResendOTPViewModel = {
    systemUserId,
  };

  const response = await axiosInstance.post<ApiResponse<UserPublicViewModel>>('/users/otp/re-send', payload);

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to resend OTP');
  }

  return { message: response.data.message };
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
  secureStorage.setItem('sessionToken', sessionKey);
  secureStorage.setItem('systemUserId', data.systemUserId.toString());

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
  secureStorage.removeItem('authToken');
  secureStorage.removeItem('user');
  secureStorage.removeItem('systemUserIdEncrypted');
  secureStorage.removeItem('systemUserId');
  return Promise.resolve();
};




