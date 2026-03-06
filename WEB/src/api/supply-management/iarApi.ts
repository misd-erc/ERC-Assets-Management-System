import axiosInstance from '@/lib/axios';
import { ApiResponse, SupplyIAR, VwSupplyIAR } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';

interface SupplyIARResponse<T> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}

interface ListResponse<T> {
  items: T[];
}

/* ------------------------------- GET ------------------------------- */

export const getSupplyIARs = async (): Promise<VwSupplyIAR[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyIARResponse<ListResponse<any>>>('/Supply/iar/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch IAR records');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map((u: any) => ({
        id: u.id,
        centerCode: u.centerCode,
        entityName: u.entityName,
        fundCluster: u.fundCluster,
        vendor: u.vendor, // Mapping nested object
        poNumber: u.poNumber,
        office: u.office, // Mapping nested object
        division: u.division, // Mapping nested object
        iarNumber: u.iarNumber,
        iarNumberDate: u.iarNumberDate,
        iarInvoiceNumber: u.iarInvoiceNumber,
        iarInvoiceNumberDate: u.iarInvoiceNumberDate,
        poDate: u.poDate,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt
      }))
    : [];
};

export const getSupplyIARById = async (iarId: number): Promise<VwSupplyIAR | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyIARResponse<any>>(
    `/Supply/iar/all/${encodeURIComponent(iarId)}`,
    { params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey } }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'IAR record not found');
    return null;
  }

  const u = response.data.data;
  return {
    id: u.id,
    centerCode: u.centerCode,
    entityName: u.entityName,
    fundCluster: u.fundCluster,
    vendor: u.vendor,
    poNumber: u.poNumber,
    office: u.office,
    division: u.division,
    iarNumber: u.iarNumber,
    iarNumberDate: u.iarNumberDate,
    iarInvoiceNumber: u.iarInvoiceNumber,
    iarInvoiceNumberDate: u.iarInvoiceNumberDate,
    poDate: u.poDate,
    isActive: u.isActive ?? true,
    createdAt: u.createdAt
  };
};

/* ------------------------------- POST ------------------------------- */

export const editSupplyIAR = async (payload: SupplyIAR): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id ?? 0,
    CenterCode: payload.centerCode,
    EntityName: payload.entityName,
    FundCluster: payload.fundCluster,
    VendorId: payload.vendorId,
    PONumber: payload.poNumber,
    OfficeId: payload.officeId,
    DivisionId: payload.divisionId,
    IARNumber: payload.iarNumber,
    IARNumberDate: payload.iarNumberDate,
    IARInvoiceNumber: payload.iarInvoiceNumber,
    IARInvoiceNumberDate: payload.iarInvoiceNumberDate,
    PODate: payload.poDate,
    IsActive: payload.isActive,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/iar/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply IAR');
  
  return { message: response.data.message ?? 'Success' };
};