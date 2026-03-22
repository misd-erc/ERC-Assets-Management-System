import { create } from 'zustand';
import { toast } from 'sonner';
import {
  EditSupplyRIS,
  EditSupplyRISItem,
  VwSupplyRIS,
  VwSupplyRISItem,
} from '@/types/supply/ris';
import {
  editSupplyRIS,
  editSupplyRISItem,
  getSupplyRISs,
  getSupplyRISItems,
  deleteSupplyRIS,
  deleteSupplyRISItem,
} from '@/api/supply-management/risApi';
import { getAuthParams } from '@/utils/auth';

interface RISState {
  risList: VwSupplyRIS[];
  currentRISItems: VwSupplyRISItem[];
  loading: boolean;
  searchQuery: string;

  setRISList: (risList: VwSupplyRIS[]) => void;
  setCurrentRISItems: (items: VwSupplyRISItem[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchRISs: () => Promise<void>;
  fetchRISItems: (risId: number) => Promise<void>;
  deleteRIS: (id: number) => Promise<void>;
  deleteRISItem: (id: number) => Promise<void>;

  // New: save RIS header + all items in one go
  saveRIS: (
    ris: EditSupplyRIS,
    items: EditSupplyRISItem[],
    originalItems: VwSupplyRISItem[]   // needed to know which items to delete
  ) => Promise<number | null>;
}

export const useRISStore = create<RISState>((set, get) => ({
  risList: [],
  currentRISItems: [],
  loading: false,
  searchQuery: '',

  setRISList: (risList) => set({ risList }),
  setCurrentRISItems: (items) => set({ currentRISItems: items }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchRISs: async () => {
    set({ loading: true });
    try {
      const risList = await getSupplyRISs();
      set({ risList });
    } catch {
      toast.error('Failed to load RIS');
    } finally {
      set({ loading: false });
    }
  },

  fetchRISItems: async (risId) => {
    set({ loading: true });
    try {
      const items = await getSupplyRISItems(risId);
      set({ currentRISItems: items });
    } catch {
      toast.error('Failed to load RIS items');
    } finally {
      set({ loading: false });
    }
  },

  deleteRIS: async (id) => {
    try {
      await deleteSupplyRIS(id);
      await get().fetchRISs();
      toast.success('RIS deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete RIS');
    }
  },

  deleteRISItem: async (id) => {
    try {
      await deleteSupplyRISItem(id);
      const risId = get().currentRISItems[0]?.risId;
      if (risId) await get().fetchRISItems(risId);
      toast.success('RIS item deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete RIS item');
    }
  },

  saveRIS: async (ris, items, originalItems) => {
    set({ loading: true });
    try {
      // 1. Save the RIS header
      const risResult = await editSupplyRIS(ris);
      const risId = risResult.id;
      if (!risId) throw new Error('Failed to obtain RIS ID');

      // 2. Delete items that are no longer present (compare originalItems with current items)
      const itemsToDelete = originalItems.filter(
        (oi) => !items.some((i) => i.id === oi.id && i.id !== 0)
      );
      for (const delItem of itemsToDelete) {
        await deleteSupplyRISItem(delItem.id);
      }

      // 3. Save each item (create new or update existing)
      for (const item of items) {
        const itemToSave = { ...item, risId };
        await editSupplyRISItem(itemToSave);
      }

      // 4. Refresh the list
      await get().fetchRISs();
      toast.success('RIS saved');
      return risId;
    } catch (error: any) {
      toast.error(error.message || 'Failed to save RIS');
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));