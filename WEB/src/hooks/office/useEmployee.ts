// src/hooks/office/useEmployee.ts
import { useEmployeeStore } from '@/store/office';

export const useEmployee = () => {
  const store = useEmployeeStore();
  const totalEmployees = store.employees.length;
  return { ...store, totalEmployees };
};
