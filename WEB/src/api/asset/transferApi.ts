import axiosInstance from '@/lib/axios';
import { MovementEditPayload, TransferRecord } from '@/types/transfer';
import { ApiResponse } from '@/types';
import { getAuthParams } from '@/utils/auth';
import { getEmployeeById } from '@/api/user-management/userApi';

/**
 * PTR/ITR Movement API Service
 * Handles Property Transfer Records (PTR) for PPE assets
 * and Inventory Transfer Records (ITR) for SE assets
 */

export interface MovementResponse {
  success: boolean;
  message: string;
  data: TransferRecord;
}

export interface GetAssetsResponse {
  success: boolean;
  message: string;
  data: {
    items: Array<{
      id: number;
      propertyNumber: string;
      description: string;
      category: string;
      group: string;
      condition: string;
      unitValue: number;
      dateAcquired: string;
    }>;
  };
}

/**
 * Helper function to normalize movement data
 * Items are already included in the API response, no need to fetch separately
 */
const enrichMovementData = async (movement: any): Promise<any> => {
  try {
    const enriched = { ...movement };

    // Items are already included in the response from the backend
    if (!enriched.items) {
      enriched.items = [];
    }

    return enriched;
  } catch (error) {
    console.error('Error enriching movement data:', error);
    return movement;
  }
};

/**
 * Get assets held by a specific employee
 * @param employeeId - Employee ID
 * @param groupName - 'PPE' or 'SE'
 * @returns Promise with array of assets held by the employee
 */
export const getAssetsByEmployee = async (employeeId: number, groupName: 'PPE' | 'SE'): Promise<any[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const pageSize = 1000;
    const pageNumber = 1;

    const url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?EmployeeId=${employeeId}&GroupName=${groupName}&PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assets for employee: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching assets for employee:', error);
    throw error;
  }
};

/**
export const getAssetsForTransfer = async (groupName?: 'ppe' | 'se'): Promise<any[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const pageSize = 1000;
    const fiscalDate = new Date().toISOString().split('T')[0];

    let url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?PageSize=${pageSize}&FiscalDate=${fiscalDate}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    if (groupName) {
      url += `&GroupName=${groupName}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assets: ${response.statusText}`);
    }

    const data: GetAssetsResponse = await response.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching assets for transfer:', error);
    throw error;
  }
};

/**
 * Create or update a movement record (PTR/ITR)
 * @param movementData - Movement record data
 * @returns Promise with the updated/created record
 */
export const editMovement = async (movementData: Omit<MovementEditPayload, 'actionBySystemUserId' | 'sessionKey'>): Promise<TransferRecord> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();

    const payload: MovementEditPayload = {
      ...movementData,
      actionBySystemUserId: systemUserId,
      sessionKey: sessionKey,
    };

    const response = await axiosInstance.post<MovementResponse>(
      '/Inventory/pta/movement/edit',
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save movement record');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error saving movement record:', error);
    throw error;
  }
};

/**
 * Get movement history for a specific asset
 * @param ptaId - PTA ID of the asset
 * @returns Promise with array of movement records
 */
export const getMovementHistory = async (ptaId: number): Promise<TransferRecord[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const response = await fetch(
      `${API_BASE_URL}/Inventory/pta/${ptaId}/movements?ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movement history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching movement history:', error);
    throw error;
  }
};

/**
 * Get list of PTA movements with filters (PTR/ITR)
 * @param ptrItrFilter - Filter by "PTR", "ITR", or specific PTR/ITR number
 * @param parIcsFilter - Filter by "PAR", "ICS", or specific PAR/ICS number
 * @param ptaId - Optional PTA ID to filter by
 * @param pageNumber - Page number for pagination
 * @param pageSize - Page size for pagination
 * @returns Promise with array of movement records
 */
export const getMovementsList = async (
  ptrItrFilter?: string,
  parIcsFilter?: string,
  ptaId?: number,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<any> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    let url = `${API_BASE_URL}/Inventory/pta/movement/list?PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    if (ptrItrFilter) {
      url += `&PtrItrFilter=${encodeURIComponent(ptrItrFilter)}`;
    }

    if (parIcsFilter) {
      url += `&ParIcsFilter=${encodeURIComponent(parIcsFilter)}`;
    }

    if (ptaId) {
      url += `&PTAId=${ptaId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movements: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Enrich movements with employee data
    const enrichedItems = await Promise.all(
      (data.data?.items || []).map((item: any) => enrichMovementData(item))
    );

    return {
      items: enrichedItems,
      totalCount: data.data?.totalCount || 0,
      pageNumber: pageNumber,
      pageSize: pageSize,
    };
  } catch (error) {
    console.error('Error fetching movements list:', error);
    throw error;
  }
};

/**
 * Get PTR movements (Property Transfer Records)
 * @param ptrNumber - Specific PTR number or "PTR" to get all PTR
 * @param pageNumber - Page number for pagination
 * @param pageSize - Page size for pagination
 * @returns Promise with array of PTR movement records
 */
export const getPTRMovements = async (
  ptrNumber?: string,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<any> => {
  return getMovementsList(ptrNumber || 'PTR', undefined, undefined, pageNumber, pageSize);
};

/**
 * Get ITR movements (Inventory Transfer Records)
 * @param itrNumber - Specific ITR number or "ITR" to get all ITR
 * @param pageNumber - Page number for pagination
 * @param pageSize - Page size for pagination
 * @returns Promise with array of ITR movement records
 */
export const getITRMovements = async (
  itrNumber?: string,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<any> => {
  return getMovementsList(itrNumber || 'ITR', undefined, undefined, pageNumber, pageSize);
};

/**
 * Get all movements and items for a specific PTR/ITR transfer number
 * @param transferNumber - The PTR or ITR number (e.g., PTR-20260126-CBHC0)
 * @returns Promise with all movements and items for that transfer
 */
export const getTransferDetails = async (transferNumber: string): Promise<any> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const url = `${API_BASE_URL}/Inventory/pta/movement/transfer-details?transferNumber=${encodeURIComponent(transferNumber)}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch transfer details: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch transfer details');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    throw error;
  }
};

/**
 * Get all transfer details with normalized movement structure
 * @param transferNumber - The PTR or ITR number (e.g., PTR-20260126-CBHC0)
 * @returns Promise with formatted movements for display
 */
export const getTransferDetailsByNumber = async (transferNumber: string): Promise<any> => {
  try {
    const data = await getTransferDetails(transferNumber);
    
    // Normalize movements for consistent display
    const normalizedMovements = (data.movements || []).map((movement: any) => ({
      movementId: movement.movementId || movement.id,
      id: movement.movementId || movement.id,
      ptaId: movement.ptaId,
      dateAssigned: movement.dateAssigned,
      ptritrNumber: movement.ptritrNumber,
      paricsNumber: movement.paricsNumber,
      fromEmployee: movement.fromEmployee,
      toEmployee: movement.toEmployee,
      office: movement.office,
      division: movement.division,
      status: movement.status,
      condition: movement.condition,
      remarks: movement.remarks,
      isActive: movement.isActive,
      items: movement.items || (movement.item ? [movement.item] : []),
      createdAt: movement.createdAt,
    }));

    return {
      transferNumber: data.transferNumber,
      transferType: data.transferType,
      movements: normalizedMovements,
      totalItems: data.totalItems,
      totalMovements: data.totalMovements,
      totalValue: data.totalValue,
    };
  } catch (error) {
    console.error('Error fetching and normalizing transfer details:', error);
    throw error;
  }
};

/**
 * Validate PTR/ITR number format
 * @param ptrItrNumber - The PTR/ITR number to validate
 * @returns boolean indicating if format is valid
 */
export const validateTransferNumber = (ptrItrNumber: string): boolean => {
  // Format validation: Allow alphanumeric with dashes/slashes
  const pattern = /^[A-Z0-9\-\/]+$/i;
  return pattern.test(ptrItrNumber) && ptrItrNumber.length > 0;
};

/**
 * Generate PTR/ITR number based on type and current date
 * @param transferType - 'PTR' for Property Transfer Record or 'ITR' for Inventory Transfer Record
 * @returns Generated PTR/ITR number
 */
export const generateTransferNumber = (transferType: 'PTR' | 'ITR'): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = Math.random().toString(36).substr(2, 5).toUpperCase();

  return `${transferType}-${year}${month}${day}-${timestamp}`;
};
