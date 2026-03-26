import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';

export interface DashboardSummary {
  totalAssets: number;
  ppe: { count: number; amount: number };
  se: { count: number; amount: number };
  supplies: { count: number; amount: number };
}

export interface PTADashboardData {
  totalPPE: number;
  totalSE: number;
  totalPPEValue: number;
  totalPPEValuePercentage: number;
  totalSEValue: number;
  totalSEValuePercentage: number;
}

export interface MonthlyMovementItem {
  month: string;
  issued: number;
  transferred: number;
}

export interface CategoryBreakdownItem {
  name: string;
  count: number;
  value: number;
}

export interface ConditionBreakdownItem {
  condition: string;
  count: number;
}

export interface DashboardAssetOverview {
  monthlyMovements: MonthlyMovementItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  conditionBreakdown: ConditionBreakdownItem[];
}

export interface DashboardRecentActivity {
  id: number;
  action: string;
  performedBy: string;
  createdAt: string;
}

export interface DashboardDisposalStats {
  pendingCount: number;
  approvedCount: number;
  disposedCount: number;
  rejectedCount: number;
  totalCount: number;
}

const authQuery = () => {
  const { systemUserId, sessionKey } = getAuthParams();
  return `ActionBySystemUserId=${encodeURIComponent(systemUserId)}&SessionKey=${encodeURIComponent(sessionKey)}`;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await axiosInstance.get('/api/dashboard/summary');
  return response.data.data;
};

export const getPTADashboard = async (): Promise<PTADashboardData> => {
  const response = await axiosInstance.get(`/Dashboard/pta?${authQuery()}`);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch PTA dashboard data');
  return response.data.data;
};

export const getAssetOverview = async (): Promise<DashboardAssetOverview> => {
  const response = await axiosInstance.get(`/Dashboard/asset-overview?${authQuery()}`);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch asset overview');
  return response.data.data;
};

export const getRecentActivities = async (): Promise<DashboardRecentActivity[]> => {
  const response = await axiosInstance.get(`/Dashboard/recent-activities?${authQuery()}`);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch recent activities');
  return response.data.data;
};

export const getDisposalStats = async (): Promise<DashboardDisposalStats> => {
  const response = await axiosInstance.get(`/Dashboard/disposal-stats?${authQuery()}`);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch disposal stats');
  return response.data.data;
};

export interface DashboardSupplyStats {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
}

export const getSupplyStats = async (): Promise<DashboardSupplyStats> => {
  const response = await axiosInstance.get(`/Dashboard/supply-stats?${authQuery()}`);
  if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch supply stats');
  return response.data.data;
};

