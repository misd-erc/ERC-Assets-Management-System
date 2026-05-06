import { useSupplyIARStore } from "@/store/supply";
import { useMemo } from 'react';

export const useSupplyIAR = () => {
  const store = useSupplyIARStore();
  
  return useMemo(() => ({
    ...store,
    totalItems: store.iars.length
  }), [store]);
};


