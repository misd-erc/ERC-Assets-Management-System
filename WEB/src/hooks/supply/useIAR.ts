import { useSupplyIARStore } from "@/store/supply";

export const useSupplyIAR = () => {
  const store = useSupplyIARStore();
  const totalItems = store.iars.length;
  return { ...store, totalItems };
};


