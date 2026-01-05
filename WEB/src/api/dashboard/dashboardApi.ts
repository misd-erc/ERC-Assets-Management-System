import axiosInstance from '@/lib/axios';

export interface DashboardSummary {
  totalAssets: number;
  ppe: {
    count: number;
    amount: number;
  };
  se: {
    count: number;
    amount: number;
  };
  supplies: {
    count: number;
    amount: number;
  };
}

export interface PTADashboardData {
  totalPPE: number;
  totalSE: number;
  totalPPEValue: number;
  totalPPEValuePercentage: number;
  totalSEValue: number;
  totalSEValuePercentage: number;
}

export interface PTADashboardResponse {
  success: boolean;
  code: string;
  message: string;
  data: PTADashboardData;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await axiosInstance.get('/api/dashboard/summary');
  return response.data.data;
};

export const getPTADashboard = async (): Promise<PTADashboardData> => {
  // Get ActionBySystemUserId and SessionKey from localStorage
  const actionBySystemUserId = localStorage.getItem('systemUserId') || '';
  const sessionKey = localStorage.getItem('sessionToken') || '';

  const response = await axiosInstance.get<PTADashboardResponse>(
    `/Dashboard/pta?ActionBySystemUserId=${encodeURIComponent(actionBySystemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch PTA dashboard data');
  }

  return response.data.data;
};
