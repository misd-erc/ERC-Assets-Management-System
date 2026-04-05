import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';
import { EditSupplyRIS, EditSupplyRISItem, VwSupplyRIS, VwSupplyRISItem } from '@/types/supply/ris';

interface ListResponse<T> {
  items: T[];
}

// ------------------- Mapping functions -------------------
const mapVwSupplyRIS = (raw: any): VwSupplyRIS => ({
  id: raw.id,
  entityName: raw.entityName,
  fundCluster: raw.fundCluster,
  office: raw.office,
  division: raw.division,
  responsibilityCenterCode: raw.responsibilityCenterCode,
  risNumber: raw.risNumber,
  risPurpose: raw.risPurpose,
  requestedBySystemUser: raw.requestedBySystemUser,
  risRequestedDate: raw.risRequestedDate,
  approvedBySystemUser: raw.approvedBySystemUser,
  risApprovedDate: raw.risApprovedDate,
  issuedBySystemUser: raw.issuedBySystemUser,
  risIssuedDate: raw.risIssuedDate,
  receivedBySystemUser: raw.receivedBySystemUser,
  risReceivedDate: raw.risReceivedDate,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt,
  items: raw.items?.map(mapVwSupplyRISItem) // if included
});

const mapVwSupplyRISItem = (raw: any): VwSupplyRISItem => ({
  id: raw.id,
  risId: raw.risId,
  stockNumber: raw.stockNumber,
  unit: raw.unit,
  itemDescription: raw.itemDescription,
  requisitionQuantity: raw.requisitionQuantity,
  isAvailable: raw.isAvailable,
  issueQuantity: raw.issueQuantity,
  itemRemarks: raw.itemRemarks,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt,
  office: raw.office,
  division: raw.division,
});

// ------------------- GET -------------------
export const getSupplyRISs = async (): Promise<VwSupplyRIS[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<ListResponse<any>>>('/Supply/ris/all', {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch RIS');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapVwSupplyRIS)
    : [];
};

// If you have a separate endpoint for a single RIS (maybe with items)
export const getSupplyRISById = async (risId: number): Promise<VwSupplyRIS | null> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<any>>(`/Supply/ris/${risId}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'RIS not found');
    return null;
  }

  return mapVwSupplyRIS(response.data.data);
};

export const getSupplyRISItems = async (risId: number): Promise<VwSupplyRISItem[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<ApiResponse<ListResponse<any>>>(`/Supply/ris-item/all/${risId}`, {
    params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
  });

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch RIS items');
    return [];
  }

  return Array.isArray(response.data.data.items)
    ? response.data.data.items.map(mapVwSupplyRISItem)
    : [];
};

// ------------------- POST / PUT -------------------


export const editSupplyRIS = async (payload: EditSupplyRIS): Promise<{ id: number }> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const requestPayload = {
    ...payload,
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
    ...payload,
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