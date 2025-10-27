import axiosInstance from '../lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserEncryptedPublicViewModel, ApiResponse } from '../types';
import { encrypt, decrypt } from '../utils/encryption';
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
}

export interface EditUserPayload {
  systemUserIdEncrypted: string;
  firstName: string;
  lastName: string;
  employeeIdEncrypted: string;
  actionBySystemUserIdEncrypted: string;
}

export const getUserDetails = async (systemUserIdEncrypted: string, actionBySystemUserIdEncrypted: string): Promise<UserDetails> => {
  // Retrieve tokens directly from localStorage to ensure we use the latest synced values
  const currentSystemId = localStorage.getItem('systemUserIdEncrypted');
  const currentActionId = localStorage.getItem('ActionBySystemUserIdEncrypted');

  // Use localStorage values if available, fallback to passed parameters
  const finalSystemId = currentSystemId || systemUserIdEncrypted;
  const finalActionId = currentActionId || actionBySystemUserIdEncrypted;

  // Debug: Log both tokens and assert equality
  console.log('[AuthAPI] getUserDetails - systemUserIdEncrypted:', finalSystemId);
  console.log('[AuthAPI] getUserDetails - ActionBySystemUserIdEncrypted:', finalActionId);

  if (finalSystemId !== finalActionId) {
    console.warn('[AuthAPI] Token mismatch detected! Syncing before API call.');
    // Auto-correct by syncing them
    if (finalActionId) {
      localStorage.setItem('systemUserIdEncrypted', finalActionId);
      console.log('[AuthAPI] Synced systemUserIdEncrypted with ActionBySystemUserIdEncrypted');
    }
  }

  const sanitizedId = sanitizeSystemUserId(finalSystemId);
  const sanitizedActionId = sanitizeSystemUserId(finalActionId);

  const response = await axiosInstance.get<ApiResponse<UserDetails>>(
    `/Users/all/${encodeURIComponent(sanitizedId)}?ActionBySystemUserIdEncrypted=${encodeURIComponent(sanitizedActionId)}`
  );

  // Check for invalid session
  if (!response.data.success || response.data.code === 'ERR_SERVER') {
    throw new Error('Session expired');
  }

  return response.data.data;
};

export const editUserDetails = async (userData: {
  systemUserIdEncrypted: string;
  firstName: string;
  lastName: string;
  email: string;
  actionBySystemUserIdEncrypted: string;
}): Promise<{ message: string }> => {
  const payload = {
    SystemUserIdEncrypted: encrypt(userData.systemUserIdEncrypted),
    FirstNameEncrypted: encrypt(userData.firstName),
    LastNameEncrypted: encrypt(userData.lastName),
    EmailEncrypted: encrypt(userData.email),
    ActionBySystemUserIdEncrypted: encrypt(userData.actionBySystemUserIdEncrypted)
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Users/edit-profile', payload);
  return { message: response.data.message };
};

export const editUserProfile = async (payload: EditUserPayload): Promise<{ message: string }> => {
  const encryptedPayload = {
    systemUserIdEncrypted: encrypt(payload.systemUserIdEncrypted),
    firstNameEncrypted: encrypt(payload.firstName),
    lastNameEncrypted: encrypt(payload.lastName),
    employeeIdEncrypted: encrypt(payload.employeeIdEncrypted),
    actionBySystemUserIdEncrypted: encrypt(payload.actionBySystemUserIdEncrypted)
  };

  const response = await axiosInstance.patch<ApiResponse<any>>('/Users/edit', encryptedPayload);
  return { message: response.data.message };
};

export const validateUser = async (userInfo: { entraId: string; firstName: string; lastName: string; email: string }): Promise<{ systemUserIdEncrypted: string; message: string }> => {
  const payload: UserValidationViewModel = {
    entraIdEncrypted: encrypt(guidToLongId(userInfo.entraId)),
    firstNameEncrypted: encrypt(userInfo.firstName),
    lastNameEncrypted: encrypt(userInfo.lastName),
    emailEncrypted: encrypt(userInfo.email)
  };

   const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/Users/validation', payload);
  const data = response.data.data;

  if (!data || !data.systemUserIdEncrypted) {
    throw new Error('Invalid response from server');
  }

  return { systemUserIdEncrypted: data.systemUserIdEncrypted, message: response.data.message };
};

export const validateOTP = async (systemUserIdEncrypted: string, otp: string): Promise<{ user: User; systemUserIdEncrypted: string }> => {
  const payload: OTPValidationViewModel = {
    systemUserIdEncrypted: systemUserIdEncrypted,
    otpEncrypted: encrypt(otp)
  };

  const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/users/otp/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Invalid OTP');
  }

  // Decrypt user data
  const systemUserId = decrypt(data.systemUserIdEncrypted);
  const firstName = data.firstNameEncrypted ? decrypt(data.firstNameEncrypted) : '';
  const lastName = data.lastNameEncrypted ? decrypt(data.lastNameEncrypted) : '';
  const email = data.emailEncrypted ? decrypt(data.emailEncrypted) : '';

  const user: User = {
    id: systemUserId,
    name: `${firstName} ${lastName}`,
    email: email,
    username: email, // Use email as username
    role: 'user', // Default role, could be determined by backend later
    entraId: '', // Will be set from MSAL
    firstName: firstName,
    lastName: lastName
  };

  return { user, systemUserIdEncrypted: data.systemUserIdEncrypted };
};

export const validateSessionToken = async (token: string, systemUserIdEncrypted: string): Promise<{ user: User; token: string }> => {
  const payload: SessionTokenValidationViewModel = {
    KeyEncrypted: encrypt(token),
    systemUserIdEncrypted: systemUserIdEncrypted
  };

  const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/users/expiry-token/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Session expired');
  }

  // Decrypt user data
  const systemUserId = decrypt(data.systemUserIdEncrypted);
  const firstName = data.firstNameEncrypted ? decrypt(data.firstNameEncrypted) : '';
  const lastName = data.lastNameEncrypted ? decrypt(data.lastNameEncrypted) : '';
  const email = data.emailEncrypted ? decrypt(data.emailEncrypted) : '';
  const newToken = data.expiryTokenEncrypted ? decrypt(data.expiryTokenEncrypted) : '';

  const user: User = {
    id: systemUserId,
    name: `${firstName} ${lastName}`,
    email: email,
    username: email,
    role: 'user',
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
  return Promise.resolve();
};
