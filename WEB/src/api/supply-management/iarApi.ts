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
  totalCount: number;
}

/* ------------------------------- GET ------------------------------- */

export const getSupplyIARs = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  search: string = ''
): Promise<{ items: VwSupplyIAR[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<SupplyIARResponse<ListResponse<any>>>('/Supply/iar/all', {
    params: { 
      ActionBySystemUserId: systemUserId, 
      SessionKey: sessionKey,
      PageNumber: pageNumber,
      PageSize: pageSize,
      Search: search
    },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch IAR records');
    return { items: [], totalCount: 0 };
  }

  return {
    items: Array.isArray(response.data.data.items)
        ? response.data.data.items.map((u: any) => ({
          id: u.id,
          recordId: u.recordId,
          drNumber: u.drNumber,
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
          actualDeliveryDate: u.actualDeliveryDate,
          isActive: u.isActive ?? true,
          createdAt: u.createdAt,
          isApproved: u.isApproved
        }))
        : [],
    totalCount: response.data.data.totalCount || 0
  };
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
    recordId: u.recordId,
    drNumber: u.drNumber,
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
    actualDeliveryDate: u.actualDeliveryDate,
    isActive: u.isActive ?? true,
    createdAt: u.createdAt,
    isApproved: u.isApproved
  };
};

/* ------------------------------- POST ------------------------------- */

export const editSupplyIAR = async (payload: SupplyIAR): Promise<{ message: string }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id ?? 0,
    RecordId: payload.recordId,
    CenterCode: payload.centerCode,
    EntityName: payload.entityName,
    FundCluster: payload.fundCluster,
    VendorId: payload.vendorId,
    OfficeId: payload.officeId,
    DivisionId: payload.divisionId,
    IARNumber: payload.iarNumber,
    IARNumberDate: payload.iarNumberDate,

    PONumber: payload.poNumber?.trim() === '' ? null : payload.poNumber,
    PODate: payload.poDate === '' ? null : payload.poDate,
    IARInvoiceNumber: payload.iarInvoiceNumber?.trim() === '' ? null : payload.iarInvoiceNumber,
    IARInvoiceNumberDate: payload.iarInvoiceNumberDate === '' ? null : payload.iarInvoiceNumberDate,

    IsActive: payload.isActive,
    isApproved: payload.isApproved,
    ActualDeliveryDate: payload.actualDeliveryDate,

    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/iar/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply IAR');
  
  return { message: response.data.message ?? 'Success' };
};