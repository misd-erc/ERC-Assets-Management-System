import { secureStorage } from '@/utils/secureStorage';

export type AccessMode = 'ams' | 'employee';

export const ACCESS_MODE_STORAGE_KEY = 'erc_access_mode';

export const getAccessMode = (): AccessMode | null => {
  const mode = secureStorage.getItem(ACCESS_MODE_STORAGE_KEY);
  return mode === 'ams' || mode === 'employee' ? mode : null;
};

export const setAccessMode = (mode: AccessMode): void => {
  secureStorage.setItem(ACCESS_MODE_STORAGE_KEY, mode);
};

export const clearAccessMode = (): void => {
  secureStorage.removeItem(ACCESS_MODE_STORAGE_KEY);
};
