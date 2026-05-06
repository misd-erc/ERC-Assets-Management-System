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
    RecordId: (payload.recordId && payload.recordId > 0) ? payload.recordId : null,
    CenterCode: payload.centerCode?.trim() || null,
    EntityName: payload.entityName?.trim() || null,
    FundCluster: payload.fundCluster?.trim() || null,
    VendorId: (payload.vendorId && payload.vendorId > 0) ? payload.vendorId : null,
    OfficeId: (payload.officeId && payload.officeId > 0) ? payload.officeId : null,
    DivisionId: (payload.divisionId && payload.divisionId > 0) ? payload.divisionId : null,
    IARNumber: payload.iarNumber?.trim() || null,
    IARNumberDate: payload.iarNumberDate || null,

    PONumber: payload.poNumber?.trim() || null,
    PODate: payload.poDate || null,
    IARInvoiceNumber: payload.iarInvoiceNumber?.trim() || null,
    IARInvoiceNumberDate: payload.iarInvoiceNumberDate || null,

    IsActive: payload.isActive ?? true,
    isApproved: payload.isApproved ?? false,
    ActualDeliveryDate: payload.actualDeliveryDate || null,

    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<any>>('/Supply/iar/edit', requestPayload);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save supply IAR');
  
  return { message: response.data.message ?? 'Success' };
};