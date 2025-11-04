import axiosInstance from '../lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserPublicViewModel, ApiResponse } from '../types';

import { guidToLongId } from '../utils/guidUtils';
import { sanitizeSystemUserId } from '../utils/sanitizationUtils';


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
}

export interface EditUserPayload {
  systemUserId: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  actionBySystemUserId: string;
}

export const getUserDetails = async (systemUserId: string, actionBySystemUserId: string): Promise<UserDetails> => {
  // Retrieve tokens directly from localStorage to ensure we use the latest synced values
  const currentSystemId = localStorage.getItem('systemUserId');
  const currentActionId = localStorage.getItem('ActionBySystemUserIdEncrypted');

  // Use localStorage values if available, fallback to passed parameters
  const finalSystemId = currentSystemId || systemUserId;
  const finalActionId = currentActionId || actionBySystemUserId;

  // Debug: Log both tokens and assert equality
  console.log('[AuthAPI] getUserDetails - systemUserId:', finalSystemId);
  console.log('[AuthAPI] getUserDetails - ActionBySystemUserIdEncrypted:', finalActionId);

  if (finalSystemId !== finalActionId) {
    console.warn('[AuthAPI] Token mismatch detected! Syncing before API call.');
    // Auto-correct by syncing them
    if (finalActionId) {
      localStorage.setItem('systemUserId', finalActionId);
      console.log('[AuthAPI] Synced systemUserId with ActionBySystemUserIdEncrypted');
    }
  }

  // Get session key from localStorage
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<ApiResponse<UserDetails>>(
    `/Users/all/${encodeURIComponent(finalSystemId)}?ActionBySystemUserId=${encodeURIComponent(finalActionId)}&SessionKey=${encodeURIComponent(sessionKey)}`
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

  const response = await axiosInstance.post<ApiResponse<UserPublicViewModel>>('/Users/validation', payload);
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
    id: userId.toString(),
    name: `${firstName} ${lastName}`,
    email: email,
    username: email,
    role: 'user',
    systemRoleName: 'user',
    entraId: '', // Will be set from MSAL
    firstName: firstName,
    lastName: lastName
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
