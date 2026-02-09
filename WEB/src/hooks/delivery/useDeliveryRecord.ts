import { useDeliveryRecordStore } from "@/store/delivery";

export const useDeliveryRecord = () => {
  const store = useDeliveryRecordStore();
  const totalItems = store.deliveryRecords.length;
  return { ...store, totalItems };
};


