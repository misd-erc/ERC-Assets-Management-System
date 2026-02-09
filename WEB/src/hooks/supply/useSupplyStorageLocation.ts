import { useSupplyStorageLocationStore } from "@/store/supply";

export const useSupplyStorageLocation = () => {
  const store = useSupplyStorageLocationStore();
  const totalStorageLocations = store.storagelocations.length;
  return { ...store, totalStorageLocations };
};


