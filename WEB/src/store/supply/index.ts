// src/store/office/useOfficeStore.ts
import { create } from 'zustand';
import { SupplyItem, VwSupplyItem, SupplyUnit, SupplyStorageLocation, SupplyIAR, VwSupplyIAR, VwSupplyUniqueRawItem } from '@/types';
import { 
  getSupplyItems,
  editSupplyItem,
  getSupplyUnits,
  editSupplyUnit,
  getSupplyStorageLocations,
  editSupplyStorageLocation,
  getSupplyIARs, // Make sure this is exported from your API
  editSupplyIAR,
  getSupplyUniqueRawItems
} from '@/api';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

/* ========================================
   SUPPLY ITEM STORE
======================================== */
interface SupplyItemState {
  supplies: SupplyItem[];
  vwSupplies: VwSupplyItem[];
  vwUniqueRawSupplies: VwSupplyUniqueRawItem[];
  loading: boolean;
  searchQuery: string;

  setSupplyItems: (supplies: SupplyItem[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyItems: () => Promise<void>;
  fetchSupplyUniqueRawItems: () => Promise<void>;
  addSupplyItem: (supply: Partial<SupplyItem>) => Promise<void>;
  updateSupplyItem: (id: number, updates: Partial<SupplyItem>) => Promise<void>;
  deleteSupplyItem: (id: number) => Promise<void>;
}

export const useSupplyItemStore = create<SupplyItemState>((set, get) => ({
  supplies: [],
  vwSupplies: [],
  vwUniqueRawSupplies: [],
  loading: false,
  searchQuery: '',

  setSupplyItems: (supplies) => set({ supplies }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSupplyItems: async () => {
    set({ loading: true });
    try {
      const vwSupplies = await getSupplyItems();
      set({ vwSupplies });
    } catch {
      toast.error('Failed to load supplies');
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
  loading: boolean;
  searchQuery: string;

  setSupplyIARs: (iars: VwSupplyIAR[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchSupplyIARs: () => Promise<void>;
  addSupplyIAR: (iar: Partial<SupplyIAR>) => Promise<void>;
  updateSupplyIAR: (id: number, updates: Partial<SupplyIAR>) => Promise<void>;
  deleteSupplyIAR: (id: number) => Promise<void>;
}

export const useSupplyIARStore = create<SupplyIARState>((set, get) => ({
  iars: [],
  loading: false,
  searchQuery: '',

  setSupplyIARs: (iars) => set({ iars }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSupplyIARs: async () => {
    set({ loading: true });
    try {
      const iars = await getSupplyIARs();
      set({ iars });
    } catch {
      toast.error('Failed to load IARs');
    } finally {
      set({ loading: false });
    }
  },

  addSupplyIAR: async (iar) => {
    try {
      await editSupplyIAR({
        id: 0,
        centerCode: iar.centerCode || '',
        entityName: iar.entityName || '',
        fundCluster: iar.fundCluster || '',
        vendorId: iar.vendorId || 0,
        poNumber: iar.poNumber || '',
        officeId: iar.officeId || 0,
        divisionId: iar.divisionId || 0,
        iarNumber: iar.iarNumber || '',
        iarNumberDate: iar.iarNumberDate || '',
        iarInvoiceNumber: iar.iarInvoiceNumber || '',
        iarInvoiceNumberDate: iar.iarInvoiceNumberDate || '',
        poDate: iar.poDate || '',
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