import { useSupplyItemStore } from "@/store/supply";
import { useMemo } from 'react';

export const useSupplyItem = () => {
  const store = useSupplyItemStore();
  
  return useMemo(() => ({
    ...store,
    totalItems: store.totalSupplies
  }), [store]);
};


