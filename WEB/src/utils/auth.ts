import { decrypt } from './encryption';

export const checkUserAccess = () => {
  const encryptedUserDetails = localStorage.getItem('userDetails');
  if (!encryptedUserDetails) {
    console.warn('[checkUserAccess] No user details found');
    return;
  }

  const userDetails = JSON.parse(decrypt(encryptedUserDetails));
  const systemRole = userDetails.systemRole;
  const systemRoleId = Array.isArray(systemRole) ? systemRole[0]?.id : systemRole?.id;
  const isActive = userDetails.isActive;

  if (!systemRoleId || !isActive) {
    window.location.href = '/no-role';
  } else {
    window.location.href = '/dashboard';
  }
};
