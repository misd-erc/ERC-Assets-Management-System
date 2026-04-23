import { create } from 'zustand';
import { toast } from 'sonner';
import { DeliveryRecord, EditDeliveryRecord, VwDeliveryRecord } from '@/types/delivery/delivery';
import { editDeliveryRecord, getDeliveryRecords, uploadDeliveryProof } from '@/api/delivery/deliveryApi';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface DeliveryRecordState {
  deliveryRecords: DeliveryRecord[];
  vwDeliveryRecords: VwDeliveryRecord[];
  loading: boolean;
  searchQuery: string;

  setDeliveryRecords: (deliveryRecord: VwDeliveryRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchDeliveryRecords: () => Promise<void>;
  addDeliveryRecord: (record: EditDeliveryRecord) => Promise<void>;
  updateDeliveryRecord: (id: number, updates: EditDeliveryRecord) => Promise<void>;
  deleteDeliveryRecord: (id: number) => Promise<void>;
  uploadProof: (id: number, file: File) => Promise<void>;
}

export const useDeliveryRecordStore = create<DeliveryRecordState>((set, get) => ({
  deliveryRecords: [],
  vwDeliveryRecords: [],
  loading: false,
  searchQuery: '',

  setDeliveryRecords: (deliveryRecord) => set({ vwDeliveryRecords: deliveryRecord }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchDeliveryRecords: async () => {
    set({ loading: true });
    try {
      const vwDeliveryRecords = await getDeliveryRecords();
      set({ vwDeliveryRecords: vwDeliveryRecords });
    } catch {
      toast.error('Failed to load delivery records');
    } finally {
      set({ loading: false });
    }
  },

  addDeliveryRecord: async (record) => {
    try {
      await editDeliveryRecord(record);
      await get().fetchDeliveryRecords();
      toast.success('Delivery Record added');
    } catch (error: any) {
      console.error("Store Error:", error);
      toast.error(error.message || 'Failed to add delivery record');
    }
  },

  updateDeliveryRecord: async (id, updates) => {
    try {
      await editDeliveryRecord(updates);
      await get().fetchDeliveryRecords();
      toast.success('Delivery record updated');
    } catch (error: any) {
      toast.error('Failed to update delivery record');
    }
  },

  deleteDeliveryRecord: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      await axiosInstance.delete(`/Delivery/record/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      await get().fetchDeliveryRecords();
      toast.success('Delivery record deleted');
    } catch {
      toast.error('Failed to delete delivery record');
    }
  },

  uploadProof: async (id: number, file: File) => {
    set({ loading: true });
    try {
      await uploadDeliveryProof(id, file);
      toast.success('Delivery proof uploaded successfully');
      await get().fetchDeliveryRecords(); // Refresh the table
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload proof');
    } finally {
      set({ loading: false });
    }
  },
}));