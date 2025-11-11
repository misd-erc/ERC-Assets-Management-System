// src/hooks/position/usePosition.ts
import { usePositionStore } from "../../store/office";

export const usePosition = () => {
  const store = usePositionStore();
  const totalPositions = store.positions.length;
  return { ...store, totalPositions };
};