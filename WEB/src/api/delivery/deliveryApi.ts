import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';
import { EditDeliveryRecord, VwDeliveryRecord } from '@/types/delivery/delivery';

interface DeliveryRecordResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

interface ListResponse<T> {
  items: T[];
}

const mapVwDeliveryRecord = (raw: any): VwDeliveryRecord => ({
  id: raw.id,
  drNumber: raw.drNumber,
  poNumber: raw.poNumber,
  vendor: raw.vendor,
  deliveryDate: raw.deliveryDate,
  employee: raw.employee,
  remarks: raw.remarks,
  isReceived: raw.isReceived,
  items: raw.items,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt,
});

/* ------------------------------- GET ------------------------------- */

export const getDeliveryRecords = async (): Promise<VwDeliveryRecord[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<DeliveryRecordResponse<ListResponse<any>>>('/Delivery/record/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch records');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapVwDeliveryRecord)
    : [];
};

export const getDeliveryRecordById = async (itemId: number): Promise<VwDeliveryRecord | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<DeliveryRecordResponse<any>>(
    `/Delivery/record/all/${encodeURIComponent(itemId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Record not found');
    return null;
  }

  return mapVwDeliveryRecord(response.data.data);
};

/* ------------------------------- POST ------------------------------- */

export const editDeliveryRecord = async (payload: EditDeliveryRecord): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    id: payload.deliveryRecord.id,
    drNumber: payload.deliveryRecord.drNumber,
    poNumber: payload.deliveryRecord.poNumber,
    vendorId: payload.deliveryRecord.vendorId,
    deliveryDate: payload.deliveryRecord.deliveryDate,
    employeeId: payload.deliveryRecord.employeeId,
    remarks: payload.deliveryRecord.remarks,
    isReceived: payload.deliveryRecord.isReceived,
    isActive: payload.deliveryRecord.isActive,
    items: payload.items,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Delivery/record/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save delivery record');
  return { message: response.data.message ?? 'Success' };
};



