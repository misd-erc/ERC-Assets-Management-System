import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';
import { getAuthParams } from '@/utils/auth';
import {
  BookingGroup,
  BookingStatistics,
  BookPTAPayload,
  BookSupplyPayload,
  PendingBookingItem,
} from '@/types/booking';

const mapBookingItem = (raw: any): PendingBookingItem => ({
  id: raw.id,
  group: raw.group,
  status: raw.status,
  supplyIARId: raw.supplyIARId,
  iarNumber: raw.iarNumber,
  deliveryRecordId: raw.deliveryRecordId,
  drNumber: raw.drNumber,
  unitSequence: raw.unitSequence,
  category: raw.category,
  categoryId: raw.categoryId,
  code: raw.code,
  description: raw.description,
  specification: raw.specification,
  measurementUnit: raw.measurementUnit,
  measurementUnitId: raw.measurementUnitId,
  quantity: raw.quantity,
  unitCost: raw.unitCost,
  reorderPoint: raw.reorderPoint,
  storageLocation: raw.storageLocation,
  storageLocationId: raw.storageLocationId,
  vendor: raw.vendor,
  vendorId: raw.vendorId,
  suggestedPropertyNumber: raw.suggestedPropertyNumber,
  deliveryDate: raw.deliveryDate,
  bookedAt: raw.bookedAt,
  finalizedSupplyItemId: raw.finalizedSupplyItemId,
  finalizedPTAId: raw.finalizedPTAId,
  createdAt: raw.createdAt,
});

export const getPendingBookingItems = async (
  group: BookingGroup,
  status: string = 'Pending',
  pageNumber: number = 1,
  pageSize: number = 9999,
  search: string = ''
): Promise<{ items: PendingBookingItem[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<any>>('/Booking/pending/list', {
    params: {
      Group: group,
      Status: status,
      SearchString: search || undefined,
      PageNumber: pageNumber,
      PageSize: pageSize,
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    },
  });

  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch pending booking items');

  const items = Array.isArray(response.data.data?.items) ? response.data.data.items.map(mapBookingItem) : [];
  return { items, totalCount: response.data.data?.totalCount || 0 };
};

export const getBookingItemById = async (id: number): Promise<PendingBookingItem | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<any>>(`/Booking/pending/${id}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) return null;
  return mapBookingItem(response.data.data);
};

export const getBookingStatistics = async (): Promise<BookingStatistics> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<BookingStatistics>>('/Booking/pending/statistics', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    return { pendingSupply: 0, pendingPPE: 0, pendingSE: 0, totalPending: 0 };
  }

  return response.data.data;
};

export const bookSupplyItem = async (payload: BookSupplyPayload): Promise<{ supplyItemId: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.post<ApiResponse<{ supplyItemId: number }>>('/Booking/supply/book', {
    ...payload,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  });

  if (!response.data.success) throw new Error(response.data.message || 'Failed to book supply item');
  return response.data.data;
};

export const bookPTAItem = async (payload: BookPTAPayload): Promise<{ ptaId: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.post<ApiResponse<{ ptaId: number }>>('/Booking/pta/book', {
    ...payload,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  });

  if (!response.data.success) throw new Error(response.data.message || 'Failed to book asset');
  return response.data.data;
};

export const cancelBookingItem = async (id: number): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.delete<ApiResponse<object>>(`/Booking/pending/cancel/${id}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) throw new Error(response.data.message || 'Failed to cancel booking item');
};
