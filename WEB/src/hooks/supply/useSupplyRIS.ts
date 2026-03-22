import { useRISStore } from '@/store/supply/risStore';

export const useSupplyRIS = () => {
  const store = useRISStore();
  const totalItems = store.risList.length;
  return { ...store, totalItems };
};