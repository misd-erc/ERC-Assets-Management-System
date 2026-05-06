// src/store/office/useOfficeStore.ts
import { create } from 'zustand';
import { SupplyItem, VwSupplyItem, SupplyUnit, SupplyStorageLocation, SupplyIAR, VwSupplyIAR, VwSupplyUniqueRawItem, VwSupplyGroupedItem } from '@/types';
import { 
  getSupplyItems,
  editSupplyItem,
  getSupplyUnits,
  editSupplyUnit,
  getSupplyStorageLocations,
  editSupplyStorageLocation,
  getSupplyIARs, // Make sure this is exported from your API
  editSupplyIAR,
  getSupplyUniqueRawItems,
  getVwSupplyGroupedItems,
  getVwSupplyGroupedItemLists
} from '@/api';
import { getCategories } from '@/api/categories/categoriesApi';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

/* ========================================
   SUPPLY ITEM STORE
======================================== */
interface SupplyItemState {
  supplies: SupplyItem[];
  vwSupplyGroupItems: VwSupplyItem[];
  vwSupplies: VwSupplyItem[];
  vwSuppliesSummary: VwSupplyItem[];
  vwSupplyGroups: VwSupplyGroupedItem[];
  vwUniqueRawSupplies: VwSupplyUniqueRawItem[];
  totalSupplies: number;
  totalGroups: number;
  totalGroupItems: number;
  loading: boolean;
  searchQuery: string;
  categories: any[];

  setSupplyItems: (supplies: SupplyItem[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyItems: (page?: number, pageSize?: number, search?: string, categoryId?: number, status?: string, storageLocationId?: number, vendorId?: number) => Promise<void>;
  fetchSupplySummary: () => Promise<void>;
  fetchSupplyUniqueRawItems: () => Promise<void>;
  fetchSupplyGroupedItems: (page?: number, pageSize?: number, search?: string, status?: string) => Promise<void>;
  fetchSupplyGroupedItemLists: (id: number, page?: number, pageSize?: number, search?: string, categoryId?: number, status?: string, storageLocationId?: number, vendorId?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addSupplyItem: (supply: Partial<SupplyItem>) => Promise<void>;
  updateSupplyItem: (id: number, updates: Partial<SupplyItem>) => Promise<void>;
  deleteSupplyItem: (id: number) => Promise<void>;
}

export const useSupplyItemStore = create<SupplyItemState>((set, get) => ({
  supplies: [],
  vwSupplies: [],
  vwSuppliesSummary: [],
  vwSupplyGroups: [],
  vwSupplyGroupItems: [],
  vwUniqueRawSupplies: [],
  totalSupplies: 0,
  totalGroups: 0,
  totalGroupItems: 0,
  loading: false,
  searchQuery: '',
  categories: [],

  setSupplyItems: (supplies) => set({ supplies }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchCategories: async () => {
    try {
      const categories = await getCategories();
      set({ categories });
    } catch {
      console.error('Failed to load categories');
    }
  },

  fetchSupplyGroupedItemLists: async (id, page = 1, pageSize = 10, search = '', categoryId, status, storageLocationId, vendorId) => {
    set({ loading: true });
    try {
      const result = await getVwSupplyGroupedItemLists(id, page, pageSize, search, categoryId, status, storageLocationId, vendorId);
      set({ vwSupplyGroupItems: result.items, totalGroupItems: result.totalCount });
    } catch {
      toast.error('Failed to load supplies');
    } finally {
      set({ loading: false });
    }
  },

  fetchSupplyItems: async (page = 1, pageSize = 10, search = '', categoryId, status, storageLocationId, vendorId) => {
    set({ loading: true });
    try {
      const result = await getSupplyItems(page, pageSize, search, categoryId, status, storageLocationId, vendorId);
      set({ vwSupplies: result.items, totalSupplies: result.totalCount });
    } catch {
      toast.error('Failed to load supplies');
    } finally {
      set({ loading: false });
    }
  },

  fetchSupplySummary: async () => {
    try {
      // Fetch a larger set for dashboard accuracy, or the backend should ideally have a summary endpoint.
      // We use a high PageSize to get as many items as reasonable for stats.
      const result = await getSupplyItems(1, 1000, '', undefined, undefined);
      set({ vwSuppliesSummary: result.items, totalSupplies: result.totalCount });
    } catch {
      console.error('Failed to load supply summary');
    }
  },

  fetchSupplyGroupedItems: async (page = 1, pageSize = 10, search = '', status) => {
    set({ loading: true });
    try {
      const result = await getVwSupplyGroupedItems(page, pageSize, search, status);
      set({ vwSupplyGroups: result.items, totalGroups: result.totalCount, totalSupplies: result.totalCount });
    } catch {
      toast.error('Failed to load supply groups');
    } finally {
      set({ loading: false });
    }
  },

  fetchSupplyUniqueRawItems: async () => {
    set({ loading: true });
    try {
      const vwUniqueRawSupplies = await getSupplyUniqueRawItems();
      set({ vwUniqueRawSupplies });
    } catch {
      toast.error('Failed to load supplies');
    } finally {
      set({ loading: false });
    }
  },

  addSupplyItem: async (supply) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await editSupplyItem({
        id: 0,
        code: supply.code || '',
        categoryId: supply.categoryId || 0,
        description: supply.description || '',
        measurementUnitId: supply.measurementUnitId || 0,
        quantity: supply.quantity || 0,
        currentStock: supply.currentStock || 0,
        unitCost: supply.unitCost || 0,
        reorderPoint: supply.reorderPoint || 0,
        storageLocationId: supply.storageLocationId || 0,
        vendorId: supply.vendorId || 0,
        isActive: supply.isActive ?? true,
      });
      await get().fetchSupplyItems();
      toast.success('Supply Item added');
    } catch {
      toast.error('Failed to add supply item');
    }
  },

  updateSupplyItem: async (id, updates) => {

    try {
      await editSupplyItem({
        id: id,
        code: updates.code || '',
        categoryId: updates.categoryId || 0,
        description: updates.description || '',
        measurementUnitId: updates.measurementUnitId || 0,
        quantity: updates.quantity || 0,
        currentStock: updates.currentStock || 0,
        unitCost: updates.unitCost || 0,
        reorderPoint: updates.reorderPoint || 0,
        storageLocationId: updates.storageLocationId || 0,
        vendorId: updates.vendorId || 0,
        isActive: updates.isActive ?? true
      });
      await get().fetchSupplyItems();
      toast.success('Supply Item updated');
    } catch {
      toast.error('Failed to update supply item');
    }
  },

  deleteSupplyItem: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Supply/item/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchSupplyItems();
      toast.success('Supply Item deleted');
    } catch {
      toast.error('Failed to delete supply Item');
    }
  },
}));


/* ========================================
   SUPPLY UNIT STORE
======================================== */
interface SupplyUnitState {
  units: SupplyUnit[];
  loading: boolean;
  searchQuery: string;

  setSupplyUnits: (units: SupplyUnit[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyUnits: () => Promise<void>;
  addSupplyUnit: (division: { id: number; name: string; isActive: boolean }) => Promise<void>;
  updateSupplyUnit: (id: number, updates: { name: string; isActive: boolean }) => Promise<void>;
  deleteSupplyUnit: (id: number) => Promise<void>;
}

export const useSupplyUnitStore = create<SupplyUnitState>((set, get) => ({
  units: [],
  loading: false,
  searchQuery: '',

  setSupplyUnits: (units) => set({ units }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSupplyUnits: async () => {
    set({ loading: true });
    try {
      const units = await getSupplyUnits();
      set({ units });
    } catch {
      toast.error('Failed to load supply units');
    } finally {
      set({ loading: false });
    }
  },

  addSupplyUnit: async (unit) => {
    try {
      await editSupplyUnit({
        id: 0,
        name: unit.name,
        isActive: unit.isActive
      });
      await get().fetchSupplyUnits();
      toast.success('Supply Unit added');
    } catch {
      toast.error('Failed to add supply unit');
    }
  },

  updateSupplyUnit: async (id, updates) => {
    try {
      await editSupplyUnit({
        id: id,
        name: updates.name,
        isActive: updates.isActive
      });
      await get().fetchSupplyUnits();
      toast.success('Supply Unit updated');
    } catch {
      toast.error('Failed to update supply unit');
    }
  },

  deleteSupplyUnit: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Supply/unit/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchSupplyUnits();
      toast.success('Supply unit deleted');
    } catch {
      toast.error('Failed to delete supply unit');
    }
  },
}));


/* ========================================
   SUPPLY STORAGE LOCATION STORE
======================================== */
interface SupplyStorageLocationState {
  storagelocations: SupplyStorageLocation[];
  loading: boolean;
  searchQuery: string;

  setSupplyStorageLocations: (storagelocations: SupplyStorageLocation[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyStorageLocations: () => Promise<void>;
  addSupplyStorageLocation: (division: { id: number; name: string; isActive: boolean }) => Promise<void>;
  updateSupplyStorageLocation: (id: number, updates: { name: string; isActive: boolean }) => Promise<void>;
  deleteSupplyStorageLocation: (id: number) => Promise<void>;
}

export const useSupplyStorageLocationStore = create<SupplyStorageLocationState>((set, get) => ({
  storagelocations: [],
  loading: false,
  searchQuery: '',

  setSupplyStorageLocations: (storagelocations) => set({ storagelocations }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSupplyStorageLocations: async () => {
    set({ loading: true });
    try {
      const storagelocations = await getSupplyStorageLocations();
      set({ storagelocations });
    } catch {
      toast.error('Failed to load supply storagelocations');
    } finally {
      set({ loading: false });
    }
  },

  addSupplyStorageLocation: async (storagelocation) => {
    try {
      await editSupplyStorageLocation({
        id: 0,
        name: storagelocation.name,
        isActive: storagelocation.isActive
      });
      await get().fetchSupplyStorageLocations();
      toast.success('Supply Unit added');
    } catch {
      toast.error('Failed to add supply storagelocation');
    }
  },

  updateSupplyStorageLocation: async (id, updates) => {
    try {
      await editSupplyStorageLocation({
        id: id,
        name: updates.name,
        isActive: updates.isActive
      });
      await get().fetchSupplyStorageLocations();
      toast.success('Supply Unit updated');
    } catch {
      toast.error('Failed to update supply storagelocation');
    }
  },

  deleteSupplyStorageLocation: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Supply/storagelocation/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchSupplyStorageLocations();
      toast.success('Supply storagelocation deleted');
    } catch {
      toast.error('Failed to delete supply storagelocation');
    }
  },
}));



/* ========================================
   SUPPLY IAR STORE
======================================== */
export interface SupplyIARState {
  iars: VwSupplyIAR[]; // Changed to VwSupplyIAR[] to match API
  iarsSummary: VwSupplyIAR[];
  totalIars: number;
  loading: boolean;
  searchQuery: string;

  setSupplyIARs: (iars: VwSupplyIAR[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyIARs: (page?: number, pageSize?: number, search?: string) => Promise<void>;
  fetchSupplyIARSummary: () => Promise<void>;
  addSupplyIAR: (iar: Partial<SupplyIAR>) => Promise<void>;
  updateSupplyIAR: (id: number, updates: Partial<SupplyIAR>) => Promise<void>;
  deleteSupplyIAR: (id: number) => Promise<void>;
}

export const useSupplyIARStore = create<SupplyIARState>((set, get) => ({
  iars: [],
  iarsSummary: [],
  totalIars: 0,
  loading: false,
  searchQuery: '',

  setSupplyIARs: (iars) => set({ iars }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSupplyIARs: async (page = 1, pageSize = 10, search = '') => {
    set({ loading: true });
    try {
      const result = await getSupplyIARs(page, pageSize, search);
      set({ iars: result.items, totalIars: result.totalCount });
    } catch {
      toast.error('Failed to load IARs');
    } finally {
      set({ loading: false });
    }
  },

  fetchSupplyIARSummary: async () => {
    try {
      // Fetch a larger set for dashboard accuracy
      const result = await getSupplyIARs(1, 1000, '');
      set({ iarsSummary: result.items });
    } catch {
      console.error('Failed to load IAR summary');
    }
  },

  addSupplyIAR: async (iar) => {
    try {
      await editSupplyIAR({
        id: 0,
        recordId: iar.recordId || 0,
        centerCode: iar.centerCode || '',
        entityName: iar.entityName || '',
        fundCluster: iar.fundCluster || '',
        vendorId: iar.vendorId || 0,
        poNumber: iar.poNumber,
        officeId: iar.officeId || 0,
        divisionId: iar.divisionId || 0,
        iarNumber: iar.iarNumber || '',
        iarNumberDate: iar.iarNumberDate || '',
        iarInvoiceNumber: iar.iarInvoiceNumber,
        iarInvoiceNumberDate: iar.iarInvoiceNumberDate,
        poDate: iar.poDate,
        actualDeliveryDate: iar.actualDeliveryDate || '',
        isActive: iar.isActive ?? true,
        isApproved: iar.isApproved ?? false,
      } as SupplyIAR);
      
      await get().fetchSupplyIARs();
      toast.success('IAR added successfully');
    } catch {
      toast.error('Failed to add IAR');
    }
  },

  updateSupplyIAR: async (id, updates) => {
    try {
      await editSupplyIAR({
        id: id,
        recordId: updates.recordId || 0,
        centerCode: updates.centerCode || '',
        entityName: updates.entityName,
        fundCluster: updates.fundCluster,
        vendorId: updates.vendorId,
        poNumber: updates.poNumber,
        officeId: updates.officeId,
        divisionId: updates.divisionId,
        iarNumber: updates.iarNumber,
        iarNumberDate: updates.iarNumberDate,
        iarInvoiceNumber: updates.iarInvoiceNumber,
        iarInvoiceNumberDate: updates.iarInvoiceNumberDate,
        poDate: updates.poDate,
        actualDeliveryDate: updates.actualDeliveryDate,
        isActive: updates.isActive ?? true,
        isApproved: updates.isApproved ?? false,
      } as SupplyIAR);
      
      await get().fetchSupplyIARs();
      toast.success('IAR updated successfully');
    } catch {
      toast.error('Failed to update IAR');
    }
  },

  deleteSupplyIAR: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Supply/iar/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      
      await get().fetchSupplyIARs();
      toast.success('IAR deleted successfully');
    } catch {
      toast.error('Failed to delete IAR');
    }
  },
}));
