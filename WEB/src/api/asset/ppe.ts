import { PPEAsset } from '@/types/asset/ppe';
import axiosInstance from '@/lib/axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const ppeApi = {
	// Batch upload PPE assets with file, ActionBySystemUserId and SessionKey params
	batchUpload: (
		file: File,
		actionBySystemUserId: string,
		sessionKey: string,
		onProgress?: (percent: number) => void
	): Promise<{ success: boolean; code: string; message: string; data: string }> => {
		return new Promise((resolve, reject) => {
			const formData = new FormData();
			formData.append('file', file);

			const url =
				API_BASE_URL +
				'/Inventory/pta/batch-upload?ActionBySystemUserId=' +
				actionBySystemUserId +
				'&SessionKey=' +
				encodeURIComponent(sessionKey);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', url);

			if (onProgress) {
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						// Map upload phase to 0–80%
						onProgress(Math.round((event.loaded / event.total) * 80));
					}
				};
				xhr.upload.onload = () => onProgress(80);
			}

			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						resolve(JSON.parse(xhr.responseText));
					} catch {
						reject(new Error('Invalid JSON response'));
					}
				} else {
					reject(new Error('Failed to batch upload PPE assets'));
				}
			};
			xhr.onerror = () => reject(new Error('Failed to batch upload PPE assets'));
			xhr.send(formData);
		});
	},

	// List PPE assets with pagination, search, optional date filters, and user/session auth
	list: async (params: {
		SearchString?: string;
		PageNumber: number;
		PageSize: number;
		StartDate?: string;
		EndDate?: string;
		ActionBySystemUserId: string;
		SessionKey: string;
		GroupName: string;
		EmployeeId?: number;
		CategoryId?: number;
		OfficeId?: number;
		DivisionId?: number;
		Condition?: string;
		IncludeRelatedData?: boolean;
	}): Promise<{ items: PPEAsset[]; totalCount: number }> => {
		const query = new URLSearchParams();

		if (params.SearchString) {
			query.append('SearchString', params.SearchString);
		}
		query.append('PageNumber', params.PageNumber.toString());
		query.append('PageSize', params.PageSize.toString());

		if (params.StartDate) {
			query.append('StartDate', params.StartDate);
		}

		if (params.EndDate) {
			query.append('EndDate', params.EndDate);
		}

		if (params.EmployeeId) {
			query.append('EmployeeId', params.EmployeeId.toString());
		}

		if (params.CategoryId) {
			query.append('CategoryId', params.CategoryId.toString());
		}

		if (params.OfficeId) {
			query.append('OfficeId', params.OfficeId.toString());
		}

		if (params.DivisionId) {
			query.append('DivisionId', params.DivisionId.toString());
		}

		if (params.Condition) {
			query.append('Condition', params.Condition);
		}

		if (params.IncludeRelatedData !== undefined) {
			query.append('IncludeRelatedData', String(params.IncludeRelatedData));
		}

		query.append('ActionBySystemUserId', params.ActionBySystemUserId);
		query.append('SessionKey', params.SessionKey);
		query.append('GroupName', params.GroupName);


		const url = API_BASE_URL + '/Inventory/pta/se-ppe/all?' + query.toString();

		const response = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});

		if (!response.ok) {
			throw new Error('Failed to fetch PPE asset list');
		}

		const data = await response.json();

		return {
			items: data.data?.items || [],
			totalCount: data.data?.totalCount || 0,
		};
	},

	// Get PPE asset details by ID
	getById: async (
		id: string,
		actionBySystemUserId: string,
		sessionKey: string
	): Promise<PPEAsset> => {
		const url =
			API_BASE_URL +
			`/Inventory/pta/se-ppe/all/${id}?ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});
		if (!response.ok) {
			throw new Error('Failed to fetch PPE asset details');
		}
		const json = await response.json();
		return json.data;
	},

	// Create PPE asset
	create: async (
		asset: any,
		actionBySystemUserId?: string,
		sessionKey?: string
	): Promise<{ success: boolean; code?: string; message?: string; data?: PPEAsset }> => {
		const url = API_BASE_URL + '/Inventory/pta/se-ppe/edit';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(asset),
		});
		if (!response.ok) {
			throw new Error(`Failed to create PPE asset: HTTP ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Update PPE asset
	update: async (
		asset: any,
		actionBySystemUserId?: string,
		sessionKey?: string
	): Promise<{ success: boolean; code?: string; message?: string; data?: PPEAsset }> => {
		const url = API_BASE_URL + `/Inventory/pta/se-ppe/edit`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(asset),
		});
		if (!response.ok) {
			throw new Error('Failed to update PPE asset');
		}
		return response.json();
	},

	// Edit PPE asset part
	editPart: async (
		partData: any
	): Promise<{ success: boolean; code?: string; message?: string; data?: any }> => {
		const url = API_BASE_URL + `/Inventory/pta/ppe/part/edit`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(partData),
		});
		if (!response.ok) {
			throw new Error('Failed to edit PPE asset part');
		}
		return response.json();
	},

	// Edit PPE asset movement
	editMovement: async (
		movementData: any
	): Promise<{ success: boolean; code?: string; message?: string; data?: any }> => {
		const response = await axiosInstance.post<{ success: boolean; code?: string; message?: string; data?: any }>(
			'/Inventory/pta/movement/edit',
			movementData
		);
		if (!response.data.success) {
			throw new Error('Failed to edit PPE asset movement');
		}
		return response.data;
	},

	// Delete PPE asset
	delete: async (
		id: number,
		actionBySystemUserId?: string,
		sessionKey?: string
	): Promise<{ success: boolean; code?: string; message?: string; data?: any }> => {
		const query = new URLSearchParams();
		if (actionBySystemUserId) query.append('ActionBySystemUserId', actionBySystemUserId);
		if (sessionKey) query.append('SessionKey', sessionKey);
		const url = API_BASE_URL + `/Inventory/pta/delete/${id}${query.toString() ? '?' + query.toString() : ''}`;
		const response = await fetch(url, {
			method: 'DELETE',
			headers: { Accept: 'application/json' },
		});
		if (!response.ok) {
			throw new Error(`Failed to delete PPE asset: HTTP ${response.status} ${response.statusText}`);
		}
		return response.json();
	}
};
