// src/hooks/position/usePosition.ts
import { usePositionStore } from "@/store/office";

export const usePosition = () => {
  const store = usePositionStore();
  const totalPositions = store.vwPositions.length;
  return { ...store, totalPositions };
};


