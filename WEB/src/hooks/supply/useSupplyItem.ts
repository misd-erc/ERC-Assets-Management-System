import { useSupplyItemStore } from "@/store/supply";

export const useSupplyItem = () => {
  const store = useSupplyItemStore();
  const totalItems = store.supplies.length;
  return { ...store, totalItems };
};


