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
 * Get movement statistics
 * @returns Promise with statistics for PTR, ITR, and Returns
 */
export const getMovementStatistics = async (): Promise<{
  activePTR: number;
  activeITR: number;
  activeReturnsPPE: number;
  activeReturnsSE: number;
  totalActive: number;
}> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const url = `${API_BASE_URL}/Inventory/pta/movement/statistics?ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movement statistics: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching movement statistics:', error);
    return {
      activePTR: 0,
      activeITR: 0,
      activeReturnsPPE: 0,
      activeReturnsSE: 0,
      totalActive: 0,
    };
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
    const asOfDate = new Date().toISOString().split('T')[0];

    let url = `${API_BASE_URL}/Inventory/pta/se-ppe/all?PageSize=${pageSize}&AsOfDate=${asOfDate}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

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
 * Get list of PTA movements with filters (PTR/ITR/RRPPE/RRSP)
 * @param ptrItrFilter - Filter by "PTR", "ITR", or specific PTR/ITR number (or "RRPPE"/"RRSP" for returns)
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

    // Check if this is a return type filter (RRPPE/RRSP) or transfer type (PTR/ITR)
    if (ptrItrFilter) {
      if (ptrItrFilter.toUpperCase() === 'RRPPE' || ptrItrFilter.toUpperCase() === 'RRSP') {
        // Use RrppeRrspFilter for return records
        url += `&RrppeRrspFilter=${encodeURIComponent(ptrItrFilter)}`;
      } else {
        // Use PtrItrFilter for transfer records
        url += `&PtrItrFilter=${encodeURIComponent(ptrItrFilter)}`;
      }
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
 * Get PTR records from the transfer/list endpoint (Group=PPE)
 * Response shape per item: { ptrItrNumber, plantillaEmployeeName, nonPlantillaEmployeeName,
 *   plantillaEmployeeId, nonPlantillaEmployeeId, dateAssigned, status, remarks, item: {...} }
 */
export const getPTRTransferList = async (
  pageNumber: number = 1,
  pageSize: number = 1000
): Promise<any> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';
    const url = `${API_BASE_URL}/Inventory/pta/transfer/list?Group=PPE&PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch PTR transfer list: ${response.statusText}`);
    const data = await response.json();
    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
      pageNumber,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching PTR transfer list:', error);
    throw error;
  }
};

/**
 * Get ITR records from the transfer/list endpoint (Group=SE)
 * Response shape per item: { ptrItrNumber, plantillaEmployeeName, nonPlantillaEmployeeName,
 *   plantillaEmployeeId, nonPlantillaEmployeeId, dateAssigned, status, remarks, item: {...} }
 */
export const getITRTransferList = async (
  pageNumber: number = 1,
  pageSize: number = 1000
): Promise<any> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';
    const url = `${API_BASE_URL}/Inventory/pta/transfer/list?Group=SE&PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Failed to fetch ITR transfer list: ${response.statusText}`);
    const data = await response.json();
    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
      pageNumber,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching ITR transfer list:', error);
    throw error;
  }
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

// Track the last generated sequence to prevent duplicates
let lastGeneratedSequence: { [key: string]: number } = {};

/**
 * Get RRPPE movements (Return Record - PPE)
 * @param rrppeNumber - Specific RRPPE number or "RRPPE" to get all RRPPE
 * @param pageNumber - Page number for pagination
 * @param pageSize - Page size for pagination
 * @returns Promise with array of RRPPE movement records
 */
export const getRRPPEMovements = async (
  rrppeNumber?: string,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<any> => {
  return getMovementsList(rrppeNumber || 'RRPPE', undefined, undefined, pageNumber, pageSize);
};

/**
 * Get RRSP movements (Return Record - SE)
 * @param rrspNumber - Specific RRSP number or "RRSP" to get all RRSP
 * @param pageNumber - Page number for pagination
 * @param pageSize - Page size for pagination
 * @returns Promise with array of RRSP movement records
 */
export const getRRSPMovements = async (
  rrspNumber?: string,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<any> => {
  return getMovementsList(rrspNumber || 'RRSP', undefined, undefined, pageNumber, pageSize);
};

/**
 * Get RRPPE/RRSP return list from /Inventory/pta/return/list
 * Only returns movements that have a valid RRPPE/RRSP number (non-empty, non-N/A).
 */
export const getPTAReturnList = async (params: {
  group?: 'PPE' | 'SE';
  rrppeRrspFilter?: string;
  searchEmployee?: string;
  officeId?: number;
  divisionId?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: any[]; totalCount: number; pageNumber: number; pageSize: number }> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const pageNumber = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? 50;

    let url = `${API_BASE_URL}/Inventory/pta/return/list?PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    if (params.group) url += `&Group=${encodeURIComponent(params.group)}`;
    if (params.rrppeRrspFilter) url += `&RrppeRrspFilter=${encodeURIComponent(params.rrppeRrspFilter)}`;
    if (params.searchEmployee) url += `&SearchEmployee=${encodeURIComponent(params.searchEmployee)}`;
    if (params.officeId) url += `&OfficeId=${params.officeId}`;
    if (params.divisionId) url += `&DivisionId=${params.divisionId}`;
    if (params.startDate) url += `&StartDate=${encodeURIComponent(params.startDate)}`;
    if (params.endDate) url += `&EndDate=${encodeURIComponent(params.endDate)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RRPPE/RRSP return list: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
      pageNumber,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching RRPPE/RRSP return list:', error);
    throw error;
  }
};

/**
 * Generate RRPPE/RRSP return number based on type and current date
 * Calls the backend API endpoint to get the next sequence number
 * @param returnType - 'RRPPE' for PPE returns or 'RRSP' for SE returns
 * @returns Promise resolving to generated return number in format: RRPPE-yyyy-mm-001 or RRSP-yyyy-mm-001
 */
export const generateReturnNumber = async (returnType: 'RRPPE' | 'RRSP'): Promise<string> => {
  try {
    // Call the dedicated backend endpoint to get the next return number
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/inventory/pta/movement/next-return-number', {
      params: {
        returnType: returnType,
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (response.data?.success && response.data?.data?.returnNumber) {
      const nextNumber = response.data.data.returnNumber;
      console.log(`Generated ${returnType} number from backend: ${nextNumber}`);
      return nextNumber;
    } else {
      throw new Error(response.data?.message || 'Failed to generate return number from backend');
    }
  } catch (error) {
    console.error('Error generating return number from backend, falling back to local generation:', error);
    
    // Fallback to local generation if backend call fails
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;

      // Call the movement list endpoint to get ALL movements for this return type and month
      const { systemUserId, sessionKey } = getAuthParams();
      const fallbackResponse = await axiosInstance.get('/inventory/pta/movement/list', {
        params: {
          pageNumber: 1,
          pageSize: 10000, // Get all records for this month
          ptrItrFilter: returnType.toUpperCase(),
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
        },
      });

      // Extract movements from response
      const movements = fallbackResponse.data?.data?.items || [];
      
      // Filter for current month and year, extract sequence numbers
      const currentMonthSequences: number[] = movements
        .map((m: any) => {
          const returnNumber = m.ptrItrNumber || m.PTRITRNumber || m.transferNumber || '';
          // Check if this movement belongs to current year-month
          if (!returnNumber.includes(yearMonth)) {
            return null;
          }
          // Extract sequence number from format: RRPPE-yyyy-mm-001
          const parts = returnNumber.split('-');
          const sequence = parseInt(parts[parts.length - 1], 10);
          return (!isNaN(sequence) && sequence > 0) ? sequence : null;
        })
        .filter((seq: number | null) => seq !== null) as number[];

      // Find the highest sequence number from API
      const maxSequence = currentMonthSequences.length > 0 
        ? Math.max(...currentMonthSequences)
        : 0;
      
      const nextSequence = maxSequence + 1;

      // Generate the new number in format: RRPPE-yyyy-mm-001 or RRSP-yyyy-mm-001
      const generatedNumber = `${returnType}-${yearMonth}-${String(nextSequence).padStart(3, '0')}`;

      console.log(`Fallback generated ${returnType} number: ${generatedNumber}`);

      return generatedNumber;
    } catch (fallbackError) {
      console.error('Error in fallback return number generation:', fallbackError);
      throw fallbackError;
    }
  }
};

// Track the last generated sequence to prevent duplicates
let lastGeneratedSequenceTransfer: { [key: string]: number } = {};

/**
 * Generate PAR/ICS number based on type and current date
 * Calls the backend API endpoint to get the next sequence number
 * @param parType - 'PAR' for PPE transfers, 'ICS' for SE transfers
 * @returns Promise resolving to generated PAR/ICS number in format: PAR-yyyy-mm-001 or ICS-yyyy-mm-001
 */
export const generateParIcsNumber = async (parType: 'PAR' | 'ICS'): Promise<string> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/Inventory/pta/movement/next-par-number', {
      params: {
        parType,
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (response.data?.success && response.data?.data?.parNumber) {
      const nextNumber = response.data.data.parNumber;
      console.log(`Generated ${parType} number from backend: ${nextNumber}`);
      return nextNumber;
    }

    throw new Error(response.data?.message || 'Failed to generate PAR/ICS number from backend');
  } catch (error) {
    console.error('Error generating PAR/ICS number:', error);
    throw error;
  }
};

/**
 * Get PTR/ITR transfer list with filters and pagination
 * Returns only movements that have a PTR/ITR number assigned
 * @param params - Query parameters for filtering
 * @returns Promise with paginated PTR/ITR transfer records
 */
export const getPTATransferList = async (params: {
  group?: 'PPE' | 'SE';
  searchEmployee?: string;
  ptrItrFilter?: string;
  rrppeRrspFilter?: string;
  officeId?: number;
  divisionId?: number;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: any[]; totalCount: number; pageNumber: number; pageSize: number }> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';

    const pageNumber = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? 50;

    let url = `${API_BASE_URL}/Inventory/pta/transfer/list?PageNumber=${pageNumber}&PageSize=${pageSize}&ActionBySystemUserId=${systemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;

    if (params.group) url += `&Group=${encodeURIComponent(params.group)}`;
    if (params.ptrItrFilter) url += `&PtrItrFilter=${encodeURIComponent(params.ptrItrFilter)}`;
    if (params.rrppeRrspFilter) url += `&RrppeRrspFilter=${encodeURIComponent(params.rrppeRrspFilter)}`;
    if (params.searchEmployee) url += `&SearchEmployee=${encodeURIComponent(params.searchEmployee)}`;
    if (params.officeId) url += `&OfficeId=${params.officeId}`;
    if (params.divisionId) url += `&DivisionId=${params.divisionId}`;
    if (params.startDate) url += `&StartDate=${encodeURIComponent(params.startDate)}`;
    if (params.endDate) url += `&EndDate=${encodeURIComponent(params.endDate)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PTR/ITR transfer list: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      items: data.data?.items || [],
      totalCount: data.data?.totalCount || 0,
      pageNumber,
      pageSize,
    };
  } catch (error) {
    console.error('Error fetching PTR/ITR transfer list:', error);
    throw error;
  }
};

/**
 * Generate PTR/ITR number based on type and current date
 * Calls the backend API endpoint to get the next sequence number
 * @param transferType - 'PTR' for Property Transfer Record or 'ITR' for Inventory Transfer Record
 * @returns Promise resolving to generated transfer number in format: yyyy-mm-001
 */
export const generateTransferNumber = async (transferType: 'PTR' | 'ITR'): Promise<string> => {
  try {
    // Call the dedicated backend endpoint to get the next number
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/inventory/pta/movement/next-number', {
      params: {
        transferType: transferType,
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
      },
    });

    if (response.data?.success && response.data?.data?.transferNumber) {
      const nextNumber = response.data.data.transferNumber;
      console.log(`Generated ${transferType} number from backend: ${nextNumber}`);
      return nextNumber;
    } else {
      throw new Error(response.data?.message || 'Failed to generate transfer number from backend');
    }
  } catch (error) {
    console.error('Error generating transfer number from backend, falling back to local generation:', error);
    
    // Fallback to local generation if backend call fails
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${month}`;
      const key = 'transfer';

      // Call the movement list endpoint to get all transfer movements and continue the
      // sequence globally, regardless of month or transfer type.
      const { systemUserId, sessionKey } = getAuthParams();
      const fallbackResponse = await axiosInstance.get('/inventory/pta/movement/list', {
        params: {
          pageNumber: 1,
          pageSize: 10000, // Get all records for this month
          ActionBySystemUserId: systemUserId,
          SessionKey: sessionKey,
        },
      });

      // Extract movements from response
      const movements = fallbackResponse.data?.data?.items || [];
      
      // Extract sequence numbers from legacy and new formats:
      // PTR-yyyy-mm-001, ITR-yyyy-mm-001, yyyy-mm-001
      const allSequences: number[] = movements
        .map((m: any) => {
          const ptrItrNumber = m.ptrItrNumber || m.PTRITRNumber || m.transferNumber || '';
          if (!ptrItrNumber) {
            return null;
          }

          const parts = String(ptrItrNumber)
            .split('-')
            .map((part) => part.trim())
            .filter(Boolean);

          const sequence = parseInt(parts[parts.length - 1], 10);
          return (!isNaN(sequence) && sequence > 0) ? sequence : null;
        })
        .filter((seq: number | null) => seq !== null) as number[];

      const maxApiSequence = allSequences.length > 0 
        ? Math.max(...allSequences)
        : 0;
      
      const maxTrackedSequence = lastGeneratedSequenceTransfer[key] || 0;
      const maxSequence = Math.max(maxApiSequence, maxTrackedSequence);
      
      const nextSequence = maxSequence + 1;

      lastGeneratedSequenceTransfer[key] = nextSequence;

      const generatedNumber = `${yearMonth}-${String(nextSequence).padStart(3, '0')}`;

      console.log(`Fallback generated ${transferType} number: ${generatedNumber} (API max: ${maxApiSequence}, Tracked max: ${maxTrackedSequence}, Next: ${nextSequence})`);

      return generatedNumber;
    } catch (fallbackError) {
      console.error('Error in fallback transfer number generation:', fallbackError);
      throw fallbackError;
    }
  }
};
