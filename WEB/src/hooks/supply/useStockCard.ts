import { useStockCardStore } from "@/store/office/stockCardStore";

export const useStockCard = () => {
  const store = useStockCardStore();
  const totalItems = store.stockCardItems.length;
  return { ...store, totalItems };
};