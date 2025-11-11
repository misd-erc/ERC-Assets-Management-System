// src/hooks/employment-type/useEmploymentType.ts
import { useEmploymentTypeStore } from "../../store/office";

export const useEmploymentType = () => {
  const store = useEmploymentTypeStore();
  const totalEmploymentTypes = store.employmentTypes.length;
  return { ...store, totalEmploymentTypes };
};