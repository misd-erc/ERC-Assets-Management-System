import { useEffect } from 'react';
import { useSupplyStore } from '@/store/supply/useSupplyStore';
import * as svc from '@/api/supply/risApi';

/**
 * Manage RIS requests
 */
export const useRISRequests = () => {
  const { risRequests, setRISRequests, addRISRequest, updateRISRequest } = useSupplyStore();

  useEffect(() => {
    (async () => {
      try {
        const data = await svc.getRISRequests();
        setRISRequests(data);
      } catch (err) {
        console.warn('useRISRequests failed', err);
        setRISRequests([]);
      }
    })();
  }, [setRISRequests]);

  const create = async (payload: Partial<any>) => {
    try {
      const res = await svc.createRISRequest(payload);
      addRISRequest(res);
      return res;
    } catch {
      return null;
    }
  };

  const update = async (id: string, patch: Partial<any>) => {
    try {
      const res = await svc.patchRISRequest(id, patch);
      updateRISRequest(id, res);
      return res;
    } catch {
      updateRISRequest(id, patch);
      return null;
    }
  };

  return { risRequests, create, update };
};

