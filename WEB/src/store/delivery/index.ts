import { create } from 'zustand';
import { toast } from 'sonner';
import { DeliveryRecord, EditDeliveryRecord, VwDeliveryRecord } from '@/types/delivery/delivery';
import { editDeliveryRecord, getDeliveryRecords, uploadDeliveryProof, getDeliveryRecordsSummary, getDeliveryRecordsStats, DeliveryRecordStats } from '@/api/delivery/deliveryApi';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

const emptyDeliveryRecordStats: DeliveryRecordStats = {
  totalDeliveries: 0,
  pendingDeliveries: 0,
  receivedDeliveries: 0,
  totalValue: 0,
  pendingValue: 0,
  deliveriesMTD: 0,
  valueReceivedMTD: 0,
};

interface DeliveryRecordState {
  deliveryRecords: DeliveryRecord[];
  vwDeliveryRecords: VwDeliveryRecord[];
  vwDeliveryRecordsSummary: VwDeliveryRecord[];
  deliveryStats: DeliveryRecordStats;
  loading: boolean;
  searchQuery: string;
  totalCount: number;
  page: number;
  pageSize: number;
  status: string;

  setDeliveryRecords: (deliveryRecord: VwDeliveryRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setStatus: (status: string) => void;

  fetchDeliveryRecords: () => Promise<void>;
  fetchDeliveryRecordsSummary: () => Promise<void>;
  fetchDeliveryStats: () => Promise<void>;
  addDeliveryRecord: (record: EditDeliveryRecord) => Promise<void>;
  updateDeliveryRecord: (id: number, updates: EditDeliveryRecord) => Promise<void>;
  deleteDeliveryRecord: (id: number) => Promise<void>;
  uploadProof: (id: number, file: File) => Promise<void>;
}

export const useDeliveryRecordStore = create<DeliveryRecordState>((set, get) => ({
  deliveryRecords: [],
  vwDeliveryRecords: [],
  vwDeliveryRecordsSummary: [],
  deliveryStats: emptyDeliveryRecordStats,
  loading: false,
  searchQuery: '',
  totalCount: 0,
  page: 1,
  pageSize: 100,
  status: 'all',

  setDeliveryRecords: (deliveryRecord) => set({ vwDeliveryRecords: deliveryRecord }),
  setLoading: (loading) => set({ loading }),
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 1 }),
  setStatus: (status) => set({ status: status, page: 1 }),

  fetchDeliveryRecords: async () => {
    set({ loading: true });
    try {
      const { page, pageSize, searchQuery, status } = get();
      const result = await getDeliveryRecords(page, pageSize, searchQuery, status);
      set({ vwDeliveryRecords: result.items, totalCount: result.totalCount });
    } catch {
      toast.error('Failed to load delivery records');
    } finally {
      set({ loading: false });
    }
  },

  fetchDeliveryRecordsSummary: async () => {
    try {
      const summary = await getDeliveryRecordsSummary();
      set({ vwDeliveryRecordsSummary: summary });
    } catch {
      // Fail silently
    }
  },

  fetchDeliveryStats: async () => {
    try {
      const stats = await getDeliveryRecordsStats();
      set({ deliveryStats: stats });
    } catch {
      // Fail silently
    }
  },

  addDeliveryRecord: async (record) => {
    try {
      await editDeliveryRecord(record);
      await get().fetchDeliveryRecords();
      await get().fetchDeliveryRecordsSummary();
      await get().fetchDeliveryStats();
      toast.success('Delivery Record added');
    } catch (error: any) {
      console.error("Store Error:", error);
      toast.error(error.message || 'Failed to add delivery record');
      throw error;
    }
  },

  updateDeliveryRecord: async (id, updates) => {
    try {
      await editDeliveryRecord(updates);
      await get().fetchDeliveryRecords();
      await get().fetchDeliveryRecordsSummary();
      await get().fetchDeliveryStats();
      toast.success('Delivery record updated');
    } catch (error: any) {
      toast.error('Failed to update delivery record');
      throw error;
    }
  },

  deleteDeliveryRecord: async (id) => {
    try {
      const { systemUserId, sessionKey } = getAuthParams();
      const response = await axiosInstance.delete(`/Delivery/record/delete/${id}`, {
        params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete delivery record');
      }
      await get().fetchDeliveryRecords();
      await get().fetchDeliveryRecordsSummary();
      await get().fetchDeliveryStats();
      toast.success('Delivery record deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete delivery record');
      throw error;
    }
  },

  uploadProof: async (id: number, file: File) => {
    set({ loading: true });
    try {
      await uploadDeliveryProof(id, file);
      toast.success('Delivery proof uploaded successfully');
      await get().fetchDeliveryRecords();
      await get().fetchDeliveryRecordsSummary();
      await get().fetchDeliveryStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload proof');
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
