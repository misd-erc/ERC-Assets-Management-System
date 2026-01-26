import axiosInstance from '@/lib/axios';
import { MovementEditPayload, TransferRecord } from '@/types/transfer';
import { ApiResponse } from '@/types';
import { getAuthParams } from '@/utils/auth';

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
