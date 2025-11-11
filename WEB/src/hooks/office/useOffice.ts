// src/hooks/office/useOffice.ts
import { useOfficeStore } from '../../store/office';
import { Office } from '../../types';

export const useOffice = () => {
  const store = useOfficeStore();

  // Derived values (like useData)
  const totalOffices = store.offices.length;
  const activeOffices = store.offices.filter(o => o.isActive).length;
  const inactiveOffices = totalOffices - activeOffices;

  return {
    ...store,
    totalOffices,
    activeOffices,
    inactiveOffices,
  };
};