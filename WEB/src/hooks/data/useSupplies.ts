import { useEffect } from 'react';
import { useSupplyStore } from '@/store/supply/useSupplyStore';
import * as svc from '@/api/supply/suppliesApi';
import { SupplyItem } from '@/types/supply/supply';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook that loads supplies into zustand store and exposes CRUD helpers
 * Replace createSupply/patchSupply/removeSupply implementations to call backend.
 */
export const useSupplies = () => {
  const { supplies, setSupplies, addSupply, updateSupply, deleteSupply } = useSupplyStore();

  useEffect(() => {
    (async () => {
      try {
        const data = await svc.getSupplies();
        setSupplies(data);
      } catch (err) {
        console.warn('useSupplies: failed to fetch supplies, falling back to empty list', err);
        setSupplies([]);
      }
    })();
  }, [setSupplies]);

  const create = async (payload: Partial<SupplyItem>) => {
    // optimistic local creation if backend missing
    try {
      const created = await svc.createSupply(payload);
      addSupply(created);
      return created;
    } catch {
      const local: SupplyItem = {
        id: uuidv4(),
        itemCode: payload.itemCode || `ITEM-${Date.now()}`,
        stockNumber: payload.stockNumber || `ITM-${Date.now()}`,
        description: payload.description || '',
        category: payload.category || '',
        unit: payload.unit || 'Piece',
        currentStock: payload.currentStock || 0,
        reorderPoint: payload.reorderPoint || 0,
        unitCost: payload.unitCost || 0,
        totalValue: (payload.currentStock || 0) * (payload.unitCost || 0),
        location: payload.location || '',
        supplier: payload.supplier || '',
        lastRestocked: new Date().toISOString(),
      };
      addSupply(local);
      return local;
    }
  };

  const update = async (id: string, patch: Partial<SupplyItem>) => {
    try {
      const updated = await svc.patchSupply(id, patch);
      updateSupply(id, updated);
      return updated;
    } catch {
      updateSupply(id, patch);
      return null;
    }
  };

  const remove = async (id: string) => {
    try {
      await svc.removeSupply(id);
      deleteSupply(id);
    } catch {
      deleteSupply(id);
    }
  };

  return { supplies, create, update, remove };
};

