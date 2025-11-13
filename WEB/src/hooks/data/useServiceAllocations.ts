import { useEffect } from 'react';
import { useSupplyStore } from '@/store/supply/useSupplyStore';
import * as svc from '@/api/supply/allocationApi';

/**
 * Loads allocations from backend
 */
export const useServiceAllocations = () => {
  const { allocations, setAllocations, addAllocation, updateAllocation } = useSupplyStore();

  useEffect(() => {
    (async () => {
      try {
        const data = await svc.getAllocations();
        setAllocations(data);
      } catch (err) {
        console.warn('useServiceAllocations failed', err);
        setAllocations([]);
      }
    })();
  }, [setAllocations]);

  const create = async (payload: Partial<any>) => {
    try {
      const res = await svc.createAllocation(payload);
      addAllocation(res);
      return res;
    } catch {
      // fallback: optimistic local add (not ideal for prod)
      return null;
    }
  };

  const update = async (id: string, patch: Partial<any>) => {
    try {
      const res = await svc.patchAllocation(id, patch);
      updateAllocation(id, res);
      return res;
    } catch {
      updateAllocation(id, patch);
      return null;
    }
  };

  return { allocations, create, update };
};

