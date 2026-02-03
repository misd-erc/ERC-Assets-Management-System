import { useSupplyUnitStore } from "@/store/supply";

export const useSupplyUnit = () => {
  const store = useSupplyUnitStore();
  const totalUnits = store.units.length;
  return { ...store, totalUnits };
};


