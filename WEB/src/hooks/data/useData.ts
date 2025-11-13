import { useDataStore } from '@/store/data/';

export const useData = () => {
  const data = useDataStore();

  return {
    ...data,
    totalAssets: data.assets.length,
    totalSupplies: data.supplies.length,
    pendingRequests: data.risRequests.filter(r => r.status === 'pending').length,
  };
};

