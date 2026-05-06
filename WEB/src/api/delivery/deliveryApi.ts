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
  supplyIAR: raw.supplyIAR,
  deliveryDate: raw.deliveryDate,
  employee: raw.employee,
  remarks: raw.remarks,
  fileId: raw.fileId,
  isReceived: raw.isReceived,
  items: raw.items,
  totalAmount: raw.totalAmount,
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
    id: payload.deliveryRecord.id || 0,
    drNumber: payload.deliveryRecord.drNumber?.trim() || null,
    deliveryDate: payload.deliveryRecord.deliveryDate || null,
    employeeId: (payload.deliveryRecord.employeeId && payload.deliveryRecord.employeeId > 0) ? payload.deliveryRecord.employeeId : null,
    remarks: payload.deliveryRecord.remarks?.trim() || null,
    isReceived: payload.deliveryRecord.isReceived ?? false,
    isActive: payload.deliveryRecord.isActive ?? true,
    items: payload.items?.map(item => ({
      ...item,
      categoryId: (item.categoryId && item.categoryId > 0) ? item.categoryId : null,
      measurementUnitId: (item.measurementUnitId && item.measurementUnitId > 0) ? item.measurementUnitId : null,
      storageLocationId: (item.storageLocationId && item.storageLocationId > 0) ? item.storageLocationId : null,
      vendorId: (item.vendorId && item.vendorId > 0) ? item.vendorId : null,
    })) || [],
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Delivery/record/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save delivery record');
  return { message: response.data.message ?? 'Success' };
};

/* ------------------------------- UPLOAD ------------------------------- */

export const uploadDeliveryProof = async (deliveryRecordId: number, file: File): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('DeliveryRecordId', deliveryRecordId.toString());
  formData.append('ActionBySystemUserId', systemUserId.toString());
  formData.append('SessionKey', sessionKey);

  const response = await axiosInstance.post<ApiResponse<any>>('/Storage/upload/delivery-record/proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) throw new Error(response.data.message || 'Failed to upload delivery proof');
  return { message: response.data.message ?? 'Success' };
};