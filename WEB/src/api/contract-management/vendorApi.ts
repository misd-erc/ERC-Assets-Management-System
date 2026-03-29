import axiosInstance from '@/lib/axios';
import { ApiResponse, Office, VwDivision, Division, Vendor } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface VendorResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
interface ListResponse<T> {
  items: T[];
}

const mapVendor = (raw: any): Vendor => ({
  id: raw.id,
  name: raw.name,
  address: raw.address,
  email: raw.email,
  contact: raw.contact,
  contactPerson: raw.contactPerson,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt,
});

/* ------------------------------- GET ------------------------------- */

export const getVendors = async (): Promise<Vendor[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<VendorResponse<ListResponse<any>>>('/Supply/vendor/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });



  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch vendors');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapVendor)
    : [];
};

export const getVendorById = async (vendorId: string): Promise<Vendor | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<VendorResponse<any>>(
    `/Supply/vendor/${encodeURIComponent(vendorId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Vendor not found');
    return null;
  }

  return mapVendor(response.data.data);
};

/* ------------------------------- POST ------------------------------- */

export const editVendor = async (payload: Vendor): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id ?? 0,
    Name: payload.name,
    Address: payload.address,
    Email: payload.email,
    Contact: payload.contact,
    ContactPerson: payload.contactPerson,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/vendor/edit', requestPayload);

  if (!response.data.success) throw new Error(response.data.message || 'Failed to save vendor');
  // toast.success(payload.id ? 'Vendor updated' : 'Vendor created');
  return { message: response.data.message ?? 'Success' };
};

/* ------------------------------- DELETE ------------------------------- */

export const deleteVendor = async (vendorId: number): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.delete<ApiResponse<any>>(`/Supply/vendor/delete/${vendorId}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to delete vendor');
    throw new Error(response.data.message || 'Failed to delete division');
  }

  return { message: response.data.message ?? 'Success' };
};



