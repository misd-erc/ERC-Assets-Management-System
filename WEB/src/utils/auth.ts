import { decrypt } from '@/utils/encryption';
import { secureStorage } from './secureStorage';

export const checkUserAccess = () => {
  const encryptedUserDetails = secureStorage.getItem('userDetails');
  if (!encryptedUserDetails) {
    console.warn('[checkUserAccess] No user details found');
    return;
  }

  const userDetails = JSON.parse(decrypt(encryptedUserDetails));
  const systemRole = userDetails.systemRole;
  const systemRoleId = Array.isArray(systemRole) ? systemRole[0]?.id : systemRole?.id;
  const roleName: string = (Array.isArray(systemRole) ? systemRole[0]?.roleName : systemRole?.roleName) ?? '';
  const isActive = userDetails.isActive;

  if (!systemRoleId || !isActive) {
    window.location.href = '/no-role';
  } else if (roleName.toLowerCase() === 'employee') {
    window.location.href = '/employee-portal';
  } else {
    window.location.href = '/dashboard';
  }
};

export const getAuthParams = () => {
  const systemUserId = Number(secureStorage.getItem('systemUserId') || '0');
  const sessionKey = secureStorage.getItem('sessionToken') || '';
  return { systemUserId, sessionKey };
};

