// src/hooks/division/useDivision.ts
import { useDivisionStore } from "../../store/office";

export const useDivision = () => {
  const store = useDivisionStore();
  const totalDivisions = store.vwDivisions.length;
  return { ...store, totalDivisions };
};