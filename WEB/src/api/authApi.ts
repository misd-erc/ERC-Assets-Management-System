import axiosInstance from '../lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserEncryptedPublicViewModel, ApiResponse } from '../types';
import { encrypt, decrypt } from '../utils/encryption';

export const validateUser = async (userInfo: { entraId: string; firstName: string; lastName: string; email: string }): Promise<{ systemUserIdEncrypted: string }> => {
  const payload: UserValidationViewModel = {
    EntraIdEncrypted: encrypt(userInfo.entraId),
    FirstNameEncrypted: encrypt(userInfo.firstName),
    LastNameEncrypted: encrypt(userInfo.lastName),
    EmailEncrypted: encrypt(userInfo.email)
  };

  const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/users/validation', payload);
  const data = response.data.data;

  if (!data || !data.SystemUserIdEncrypted) {
    throw new Error('Invalid response from server');
  }

  return { systemUserIdEncrypted: data.SystemUserIdEncrypted };
};

export const validateOTP = async (systemUserIdEncrypted: string, otp: string): Promise<{ user: User; token: string }> => {
  const payload: OTPValidationViewModel = {
    SystemUserIdEncrypted: systemUserIdEncrypted,
    OTPEncrypted: encrypt(otp)
  };

  const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/users/otp/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Invalid OTP');
  }

  // Decrypt user data
  const systemUserId = decrypt(data.SystemUserIdEncrypted);
  const firstName = data.FirstNameEncrypted ? decrypt(data.FirstNameEncrypted) : '';
  const lastName = data.LastNameEncrypted ? decrypt(data.LastNameEncrypted) : '';
  const email = data.EmailEncrypted ? decrypt(data.EmailEncrypted) : '';
  const token = data.ExpiryTokenEncrypted ? decrypt(data.ExpiryTokenEncrypted) : '';

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

  return { user, token };
};

export const validateSessionToken = async (token: string, systemUserIdEncrypted: string): Promise<{ user: User; token: string }> => {
  const payload: SessionTokenValidationViewModel = {
    KeyEncrypted: encrypt(token),
    SystemUserIdEncrypted: systemUserIdEncrypted
  };

  const response = await axiosInstance.post<ApiResponse<UserEncryptedPublicViewModel>>('/users/expiry-token/validation', payload);
  const data = response.data.data;

  if (!data) {
    throw new Error('Session expired');
  }

  // Decrypt user data
  const systemUserId = decrypt(data.SystemUserIdEncrypted);
  const firstName = data.FirstNameEncrypted ? decrypt(data.FirstNameEncrypted) : '';
  const lastName = data.LastNameEncrypted ? decrypt(data.LastNameEncrypted) : '';
  const email = data.EmailEncrypted ? decrypt(data.EmailEncrypted) : '';
  const newToken = data.ExpiryTokenEncrypted ? decrypt(data.ExpiryTokenEncrypted) : '';

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
