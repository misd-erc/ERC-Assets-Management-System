import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

interface ApiResponse<T> {
	success: boolean;
	message?: string;
	code?: string;
	data: T;
}

/* ------------------------------- GET ------------------------------- */

// UPDATED: Added isActive to the return type
export const getCategories = async (): Promise<{ id: number; name: string; generalCode?: string; isActive?: boolean }[]> => {
  const { systemUserId, sessionKey } = getAuthParams();

  try {
    const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; generalCode?: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/category/all', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });

    if (!response.data.success) {
      console.error('Failed to fetch categories:', response.data.message);
      return [];
    }

    // UPDATED: Included isActive in the returned object
    return response.data.data?.items?.map(item => ({ 
        id: item.id, 
        name: item.name, 
        generalCode: item.generalCode,
        isActive: item.isActive // <--- Critical Fix
    })) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getLegends = async (): Promise<{ id: number; name: string; description?: string }[]> => {
	const { systemUserId, sessionKey } = getAuthParams();

	try {
		const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; description?: string; isActive: boolean; isDeleted: boolean; createdAt: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/legend/all', {
			params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
		});

		if (!response.data.success) {
			console.error('Failed to fetch legends:', response.data.message);
			return [];
		}

		return response.data.data?.items?.map(item => ({ id: item.id, name: item.name, description: item.description })) || [];
	} catch (error) {
		console.error('Error fetching legends:', error);
		return [];
	}
};

export const getConditions = async (): Promise<string[]> => {
	const { systemUserId, sessionKey } = getAuthParams();

	try {
		const response = await axiosInstance.get<ApiResponse<string[]>>('/Inventory/pta/conditions/all', {
			params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
		});

		if (!response.data.success) {
			console.error('Failed to fetch conditions:', response.data.message);
			return [];
		}

		return response.data.data || [];
	} catch (error) {
		console.error('Error fetching conditions:', error);
		return [];
	}
};

/* --------------------------- EMPLOYEE ASSETS --------------------------- */

export const getEmployeeAssets = async (employeeId: number, group: 'PPE' | 'SE'): Promise<any[]> => {
	const { systemUserId, sessionKey } = getAuthParams();

	try {
		const response = await axiosInstance.get<ApiResponse<{ items: any[]; totalCount: number }>>('/Inventory/pta/se-ppe/all', {
			params: {
				EmployeeId: employeeId,
				GroupName: group,
				PageNumber: 1,
				PageSize: 1000,
				ActionBySystemUserId: systemUserId,
				SessionKey: sessionKey,
			},
		});

		if (!response.data.success) {
			console.error(`Failed to fetch ${group} assets for employee:`, response.data.message);
			return [];
		}

		return response.data.data?.items || [];
	} catch (error) {
		console.error(`Error fetching ${group} assets for employee:`, error);
		return [];
	}
};

/* ------------------------ LEGENDS (detailed) ------------------------ */

// Non-breaking addition: returns extended fields for legends for management UI
export const getLegendsDetailed = async (): Promise<{ id: number; name: string; generalCode?: string; isActive?: boolean; createdAt?: string }[]> => {
	const { systemUserId, sessionKey } = getAuthParams();

	try {
		const response = await axiosInstance.get<ApiResponse<{ items: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string; generalCode?: string }[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>>('/Inventory/pta/legend/all', {
			params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
		});

		if (!response.data.success) {
			console.error('Failed to fetch legends (detailed):', response.data.message);
			return [];
		}

		return response.data.data?.items?.map(item => ({
			id: item.id,
			name: item.name,
			generalCode: (item as any).generalCode ?? '',
			isActive: item.isActive,
			createdAt: item.createdAt,
		})) || [];
	} catch (error) {
		console.error('Error fetching legends (detailed):', error);
		return [];
	}
};

// ------------------------ LEGENDS CRUD ------------------------
export const createLegend = async (legend: { name: string; generalCode?: string }, actionBySystemUserId: string, sessionKey: string): Promise<ApiResponse<{ id: number }>> => {
	try {
		const response = await axiosInstance.post<ApiResponse<{ id: number }>>('/Inventory/pta/legend/create', {
			...legend,
			ActionBySystemUserId: actionBySystemUserId,
			SessionKey: sessionKey,
		});
		return response.data;
	} catch (error) {
		console.error('Error creating legend:', error);
		return { success: false, message: 'Error creating legend', data: { id: 0 } };
	}
};

export const updateLegend = async (id: number, legend: { name?: string; generalCode?: string; isActive?: boolean }, actionBySystemUserId: string, sessionKey: string): Promise<ApiResponse<null>> => {
	try {
		const response = await axiosInstance.put<ApiResponse<null>>(`/Inventory/pta/legend/update/${id}`, {
			...legend,
			ActionBySystemUserId: actionBySystemUserId,
			SessionKey: sessionKey,
		});
		return response.data;
	} catch (error) {
		console.error('Error updating legend:', error);
		return { success: false, message: 'Error updating legend', data: null };
	}
};

export const deleteLegend = async (id: number, actionBySystemUserId: string, sessionKey: string): Promise<ApiResponse<null>> => {
	try {
		const response = await axiosInstance.delete<ApiResponse<null>>(`/Inventory/pta/legend/delete/${id}`, {
			params: { ActionBySystemUserId: actionBySystemUserId, SessionKey: sessionKey },
		});
		return response.data;
	} catch (error) {
		console.error('Error deleting legend:', error);
		return { success: false, message: 'Error deleting legend', data: null };
	}
};
