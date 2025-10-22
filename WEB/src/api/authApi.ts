import axiosInstance from '../lib/axios';
import { User, UserValidationViewModel, OTPValidationViewModel, SessionTokenValidationViewModel, UserEncryptedPublicViewModel, ApiResponse } from '../types';
import { encrypt, decrypt } from '../utils/encryption';
import { guidToLongId } from '../utils/guidUtils';


export interface UserDetails {
  id: number;
  FirstName: string;
  LastName: string;
  Email: string;
  StatusName: string;
  SystemRoleName: string;
  OfficeName: string;
  OfficeAcronym: string;
  DivisionName: string;
  DivisionAcronym: string;
  IsActive: boolean;
  CreatedAt: string;
  LastLoginAt: string;
}

export const getUserDetails = async (systemUserIdEncrypted: string, actionBySystemUserIdEncrypted: string): Promise<UserDetails> => {
  const sanitizedId = systemUserIdEncrypted.replace(/^\uFEFF/, '');
  const response = await axiosInstance.get<ApiResponse<UserDetails>>(
    `/Users/all/${encodeURIComponent(sanitizedId)}?ActionBySystemUserIdEncrypted=${encodeURIComponent(actionBySystemUserIdEncrypted.replace(/^\uFEFF/, ''))}`
  );
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
