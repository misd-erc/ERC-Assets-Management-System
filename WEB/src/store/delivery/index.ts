import { create } from 'zustand';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';
import { DeliveryRecord, EditDeliveryRecord, VwDeliveryRecord } from '@/types/delivery/delivery';
import { editDeliveryRecord, getDeliveryRecords } from '@/api/delivery/deliveryApi';

interface DeliveryRecordState {
  deliveryRecords: DeliveryRecord[];
  vwDeliveryRecords: VwDeliveryRecord[];
  loading: boolean;
  searchQuery: string;

  setDeliveryRecords: (deliveryRecord: VwDeliveryRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;

  fetchDeliveryRecords: () => Promise<void>;
  addDeliveryRecord: (deliveryRecord: Partial<EditDeliveryRecord>) => Promise<void>;
  updateDeliveryRecord: (id: number, updates: Partial<EditDeliveryRecord>) => Promise<void>;
  deleteDeliveryRecord: (id: number) => Promise<void>;
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
      set({ vwDeliveryRecords });
    } catch {
      toast.error('Failed to load supplies');
    } finally {
      set({ loading: false });
    }
  },

  addDeliveryRecord: async (record) => {
    try {
        const { systemUserId, sessionKey } = getAuthParams();
      await editDeliveryRecord({
        deliveryRecord: {
          id: 0,
          drNumber: record.deliveryRecord?.drNumber || '',
          poNumber: record.deliveryRecord?.poNumber || '',
          vendorId: record.deliveryRecord?.vendorId || 0,
          deliveryDate: record.deliveryRecord?.deliveryDate || '',
          employeeId: record.deliveryRecord?.employeeId || 0,
          remarks: record.deliveryRecord?.remarks || '',
          isReceived: record.deliveryRecord?.isReceived ?? false,
          isActive: record.deliveryRecord?.isActive ?? true
        },
        items: record.items || []
      });
      await get().fetchDeliveryRecords();
      toast.success('Delivery Record added');
    } catch {
      toast.error('Failed to add delivery record');
    }
  },

  updateDeliveryRecord: async (id, updates) => {
    try {
      await editDeliveryRecord({
        deliveryRecord: {
          id: id,
          drNumber: updates.deliveryRecord?.drNumber || '',
          poNumber: updates.deliveryRecord?.poNumber || '',
          vendorId: updates.deliveryRecord?.vendorId || 0,
          deliveryDate: updates.deliveryRecord?.deliveryDate || '',
          employeeId: updates.deliveryRecord?.employeeId || 0,
          remarks: updates.deliveryRecord?.remarks || '',
          isReceived: updates.deliveryRecord?.isReceived ?? false,
          isActive: updates.deliveryRecord?.isActive ?? true,
        },
        items: updates.items || []
      });
      await get().fetchDeliveryRecords();
      toast.success('Delivery record updated');
    } catch {
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
}));
