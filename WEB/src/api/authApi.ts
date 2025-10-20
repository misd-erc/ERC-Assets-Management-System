import axiosInstance from '../lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserEncryptedPublicViewModel, ApiResponse } from '../types';
import { encrypt, decrypt } from '../utils/encryption';
import { guidToLongId } from '../utils/guidUtils';

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

export const validateOTP = async (systemUserIdEncrypted: string, otp: string): Promise<{ user: User; token: string }> => {
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
  const token = data.expiryTokenEncrypted ? decrypt(data.expiryTokenEncrypted) : '';

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
