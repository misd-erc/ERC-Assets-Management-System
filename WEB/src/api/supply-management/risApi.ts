import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';
import { EditSupplyRIS, EditSupplyRISItem, VwSupplyRIS, VwSupplyRISItem } from '@/types/supply/ris';

// ------------------- Mapping functions -------------------
const mapVwSupplyRIS = (raw: any): VwSupplyRIS => ({
  id: raw.id ?? raw.Id,
  entityName: raw.entityName ?? raw.EntityName,
  fundCluster: raw.fundCluster ?? raw.FundCluster,
  office: raw.office ?? raw.Office,
  division: raw.division ?? raw.Division,
  responsibilityCenterCode: raw.responsibilityCenterCode ?? raw.ResponsibilityCenterCode,
  risNumber: raw.risNumber ?? raw.RisNumber ?? raw.RISNumber,
  risPurpose: raw.risPurpose ?? raw.RisPurpose ?? raw.RISPurpose,
  requestedBySystemUser: raw.requestedBySystemUser ?? raw.RequestedBySystemUser,
  risRequestedDate: raw.risRequestedDate ?? raw.RisRequestedDate ?? raw.RISRequestedDate,
  approvedBySystemUser: raw.approvedBySystemUser ?? raw.ApprovedBySystemUser,
  risApprovedDate: raw.risApprovedDate ?? raw.RisApprovedDate ?? raw.RISApprovedDate,
  issuedBySystemUser: raw.issuedBySystemUser ?? raw.IssuedBySystemUser,
  risIssuedDate: raw.risIssuedDate ?? raw.RisIssuedDate ?? raw.RISIssuedDate,
  receivedBySystemUser: raw.receivedBySystemUser ?? raw.ReceivedBySystemUser,
  risReceivedDate: raw.risReceivedDate ?? raw.RisReceivedDate ?? raw.RISReceivedDate,
  isApproved: raw.isApproved ?? raw.IsApproved,
  isActive: raw.isActive ?? raw.IsActive ?? true,
  createdAt: raw.createdAt ?? raw.CreatedAt,
  items: (raw.items ?? raw.Items)?.map(mapVwSupplyRISItem) // if included
});

const mapVwSupplyRISItem = (raw: any): VwSupplyRISItem => ({
  id: raw.id ?? raw.Id,
  risId: raw.risId ?? raw.RisId ?? raw.RISId ?? raw.supplyRISId ?? raw.SupplyRISId,
  stockNumber: raw.stockNumber ?? raw.StockNumber,
  unit: raw.unit ?? raw.Unit,
  itemDescription: raw.itemDescription ?? raw.ItemDescription,
  requisitionQuantity: raw.requisitionQuantity ?? raw.RequisitionQuantity,
  isAvailable: raw.isAvailable ?? raw.IsAvailable,
  issueQuantity: raw.issueQuantity ?? raw.IssueQuantity,
  itemRemarks: raw.itemRemarks ?? raw.ItemRemarks,
  isActive: raw.isActive ?? raw.IsActive ?? true,
  createdAt: raw.createdAt ?? raw.CreatedAt,
  office: raw.office ?? raw.Office,
  division: raw.division ?? raw.Division,
});

interface ListResponse<T> {
  items: T[];
  totalCount: number;
}

// ------------------- GET -------------------
export const getSupplyRISs = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  search: string = '',
  status?: string,
  officeId?: number,
  divisionId?: number,
  startDate?: string,
  endDate?: string
): Promise<{ items: VwSupplyRIS[]; totalCount: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<ListResponse<any>>>('/Supply/ris/all', {
    params: { 
      ActionBySystemUserId: systemUserId, 
      SessionKey: sessionKey,
      PageNumber: pageNumber,
      PageSize: pageSize,
      SearchString: search,
      Status: status,
      OfficeId: officeId,
      DivisionId: divisionId,
      StartDate: startDate,
      EndDate: endDate
    },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch RIS');
    return { items: [], totalCount: 0 };
  }

  return {
    items: Array.isArray(response.data.data.items) ? response.data.data.items.map(mapVwSupplyRIS) : [],
    totalCount: response.data.data.totalCount || 0
  };
};

// If you have a separate endpoint for a single RIS (maybe with items)
export const getSupplyRISById = async (risId: number): Promise<VwSupplyRIS | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  console.log('[API] getSupplyRISById - Fetching RIS ID:', risId);
  try {
    const response = await axiosInstance.get<ApiResponse<any>>(`/Supply/ris/${risId}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    console.log('[API] getSupplyRISById - Response:', response.data);

    if (!response.data.success) {
      toast.error(response.data.message || 'RIS not found');
      return null;
    }

    const mapped = mapVwSupplyRIS(response.data.data);
    console.log('[API] getSupplyRISById - Mapped RIS:', mapped);
    return mapped;
  } catch (error) {
    console.error('[API] getSupplyRISById - Error:', error);
    return null;
  }
};

export const getSupplyRISItems = async (risId: number): Promise<VwSupplyRISItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  console.log('[API] getSupplyRISItems - Fetching RIS Items for RIS ID:', risId);
  try {
    const response = await axiosInstance.get<ApiResponse<ListResponse<any>>>(`/Supply/ris-item/all/${risId}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    console.log('[API] getSupplyRISItems - Response:', response.data);

    if (!response.data.success) {
      toast.error(response.data.message || 'Failed to fetch RIS items');
      return [];
    }

    const mapped = Array.isArray(response.data.data.items)
      ? response.data.data.items.map(mapVwSupplyRISItem)
      : [];
    console.log('[API] getSupplyRISItems - Mapped RIS Items:', mapped);
    return mapped;
  } catch (error) {
    console.error('[API] getSupplyRISItems - Error:', error);
    return [];
  }
};

// ------------------- POST / PUT -------------------


export const editSupplyRIS = async (payload: EditSupplyRIS): Promise<{ id: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id || 0,
    EntityName: payload.entityName,
    FundCluster: payload.fundCluster,
    OfficeId: payload.officeId,
    DivisionId: payload.divisionId,
    ResponsibilityCenterCode: payload.responsibilityCenterCode,
    RISNumber: payload.risNumber,
    RISPurpose: payload.risPurpose,
    RISRequestedBySystemUserId: payload.risRequestedBySystemUserId,
    RISRequestedDate: payload.risRequestedDate,
    RISApprovedBySystemUserId: payload.risApprovedBySystemUserId,
    RISApprovedDate: payload.risApprovedDate,
    RISIssuedBySystemUserId: payload.risIssuedBySystemUserId,
    RISIssuedDate: payload.risIssuedDate,
    RISReceivedBySystemUserId: payload.risReceivedBySystemUserId,
    RISReceivedDate: payload.risReceivedDate,
    IsApproved: payload.isApproved,
    IsActive: payload.isActive,
    CreatedAt: payload.createdAt,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<{ supplyRISId: number }>>(
    '/Supply/ris/edit',
    requestPayload
  );
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save RIS');
  return { id: response.data.data?.supplyRISId ?? 0 };
};

export const editSupplyRISItem = async (payload: EditSupplyRISItem): Promise<{ id: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    Id: payload.id || 0,
    RISId: payload.risId || 0,
    StockNumber: payload.stockNumber,
    UnitId: payload.unitId || 0,
    ItemDescription: payload.itemDescription,
    RequisitionQuantity: payload.requisitionQuantity || 0,
    IsAvailable: payload.isAvailable ?? true,
    IssueQuantity: payload.issueQuantity || 0,
    ItemRemarks: payload.itemRemarks,
    IsActive: payload.isActive ?? true,
    CreatedAt: payload.createdAt,
    ActionBySystemUserId: systemUserId,
    SessionKey: sessionKey,
  };

  const response = await axiosInstance.post<ApiResponse<{ supplyRISItemId: number }>>(
    '/Supply/ris-item/edit',
    requestPayload
  );
  if (!response.data.success) throw new Error(response.data.message || 'Failed to save RIS item');
  return { id: response.data.data?.supplyRISItemId ?? 0 };
};

// Delete endpoints (not provided, but we may need them)
export const deleteSupplyRIS = async (id: number): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  const response = await axiosInstance.delete(`/Supply/ris/delete/${id}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });
  if (!response.data.success) throw new Error(response.data.message || 'Failed to delete RIS');
};

export const deleteSupplyRISItem = async (id: number): Promise<void> => {
  const { systemUserId, sessionKey } = getAuthParams();
  const response = await axiosInstance.delete(`/Supply/ris-item/delete/${id}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });
  if (!response.data.success) throw new Error(response.data.message || 'Failed to delete RIS item');
};