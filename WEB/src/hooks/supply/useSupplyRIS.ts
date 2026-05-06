import { useRISStore } from '@/store/supply/risStore';
import { useMemo } from 'react';

export const useSupplyRIS = () => {
  const store = useRISStore();
  
  return useMemo(() => ({
    ...store,
    totalItems: store.risList.length
  }), [store]);
};