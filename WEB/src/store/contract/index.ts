// src/store/office/useOfficeStore.ts
import { create } from 'zustand';
import { Vendor } from '@/types';
import { getVendors,editVendor } from '@/api';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

/* ========================================
   OFFICE STORE
======================================== */
interface VendorState {
  vendors: Vendor[];
  loading: boolean;
  searchQuery: string;

  setVendors: (vendors: Vendor[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchVendors: () => Promise<void>;
  addVendor: (vendor: Partial<Vendor>) => Promise<void>;
  updateVendor: (id: number, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: number) => Promise<void>;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  loading: false,
  searchQuery: '',

  setVendors: (vendors) => set({ vendors }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchVendors: async () => {
    set({ loading: true });
    try {
      const vendors = await getVendors();
      set({ vendors });
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      set({ loading: false });
    }
  },

  addVendor: async (vendor) => {
    try {
        const { systemUserId, sessionKey } = getAuthParams();
      await editVendor({
        id: 0,
        name: vendor.name || '',
        address: vendor.address || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        contactPerson: vendor.contactPerson || '',
        isActive: vendor.isActive ?? true,
      });
      await get().fetchVendors();
      toast.success('Vendor added');
    } catch {
      toast.error('Failed to add vendor');
    }
  },

  updateVendor: async (id, updates) => {
    try {
      await editVendor({
        id: id,
        name: updates.name || '',
        address: updates.address || '',
        email: updates.email || '',
        contact: updates.contact || '',
        contactPerson: updates.contactPerson || '',
        isActive: updates.isActive ?? true
      });
      await get().fetchVendors();
      toast.success('Vendor updated');
    } catch {
      toast.error('Failed to update vendor');
    }
  },

  deleteVendor: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Supply/vendor/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchVendors();
      toast.success('Vendor deleted');
    } catch {
      toast.error('Failed to delete vendor');
    }
  },
}));



