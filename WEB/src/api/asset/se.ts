import { SEAsset } from '@/types/supply/se';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const seApi = {
	// Batch upload SE assets with file, ActionBySystemUserId and SessionKey params
	batchUpload: async (
		file: File,
		actionBySystemUserId: string,
		sessionKey: string
	): Promise<{ success: boolean; code: string; message: string; data: string }> => {
		const formData = new FormData();
		formData.append('file', file);

		const url =
			API_BASE_URL +
			'/Inventory/pta/batch-upload?ActionBySystemUserId=' +
			actionBySystemUserId +
			'&SessionKey=' +
			encodeURIComponent(sessionKey);

		const response = await fetch(url, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			throw new Error('Failed to batch upload SE assets');
		}

		return response.json();
	},
	// List SE assets with pagination, search, optional date filters, and user/session auth
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
	}): Promise<{ items: SEAsset[]; totalCount: number }> => {
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

		query.append('ActionBySystemUserId', params.ActionBySystemUserId);
		query.append('SessionKey', params.SessionKey);
		query.append('GroupName', params.GroupName);

		const url = API_BASE_URL + '/Inventory/pta/se-ppe/all?' + query.toString();

		const response = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});

		if (!response.ok) {
			throw new Error('Failed to fetch SE asset list');
		}

		const data = await response.json();

		return {
			items: data.data?.items || [],
			totalCount: data.data?.totalCount || 0,
		};
	},

	// Get SE asset details by ID
	getById: async (
		id: string,
		actionBySystemUserId: string,
		sessionKey: string
	): Promise<SEAsset> => {
		const url =
			API_BASE_URL +
			`/Inventory/pta/se-ppe/all/${id}?ActionBySystemUserId=${actionBySystemUserId}&SessionKey=${encodeURIComponent(sessionKey)}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: { Accept: 'application/json' },
		});
		if (!response.ok) {
			throw new Error('Failed to fetch SE asset details');
		}
		const json = await response.json();
		return json.data;
	},

	// Create SE asset
	create: async (
		asset: Partial<SEAsset>,
		actionBySystemUserId: string,
		sessionKey: string
	): Promise<{ success: boolean; code?: string; message?: string; data?: SEAsset }> => {
		const url = API_BASE_URL + '/Inventory/pta/se-ppe/edit';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ ...asset, actionBySystemUserId, sessionKey }),
		});
		if (!response.ok) {
			throw new Error(`Failed to create SE asset: HTTP ${response.status} ${response.statusText}`);
		}
		return response.json();
	},

	// Update SE asset
	update: async (
		id: string,
		asset: Partial<SEAsset>,
		actionBySystemUserId: string,
		sessionKey: string
	): Promise<{ success: boolean; code?: string; message?: string; data?: SEAsset }> => {
		const url = API_BASE_URL + `/Inventory/pta/se-ppe/update/${id}`;
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ ...asset, actionBySystemUserId, sessionKey }),
		});
		if (!response.ok) {
			throw new Error('Failed to update SE asset');
		}
		return response.json();
	},

	// Create or update part (shared PPE/SE)
	editPart: async (
		partData: any
	): Promise<{ success: boolean; code?: string; message?: string; data?: any }> => {
		const url = API_BASE_URL + '/Inventory/pta/part/edit';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(partData),
		});
		if (!response.ok) {
			throw new Error('Failed to save asset part');
		}
		return response.json();
	},

	// Create or update movement (shared PPE/SE)
	editMovement: async (
		movementData: any
	): Promise<{ success: boolean; code?: string; message?: string; data?: any }> => {
		const url = API_BASE_URL + '/Inventory/pta/movement/edit';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(movementData),
		});
		if (!response.ok) {
			throw new Error('Failed to save asset movement');
		}
		return response.json();
	},

	// Delete SE asset
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
			throw new Error(`Failed to delete SE asset: HTTP ${response.status} ${response.statusText}`);
		}
		return response.json();
	}
};
