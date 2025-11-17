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

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await axiosInstance.get('/api/dashboard/summary');
  return response.data.data;
};
