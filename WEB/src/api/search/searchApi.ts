import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

export interface GlobalSearchResultItem {
  id: string;
  title: string;
  description: string;
  category: string;
  module: string;
}

export const globalSearch = async (q: string): Promise<GlobalSearchResultItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();
  const response = await axiosInstance.get('/Search', {
    params: {
      q,
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    },
  });
  if (!response.data.success) return [];
  return response.data.data ?? [];
};
