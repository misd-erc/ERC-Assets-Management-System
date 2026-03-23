import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types';
import { toast } from 'sonner';
import { getAuthParams } from '@/utils/auth';
import { SupplyStockCardItem } from '@/types/supply/stockcard';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface StockCardApiResponse extends ApiResponse<PaginatedResponse<SupplyStockCardItem>> {}

export const getStockCardItems = async (
  stockNumber: string,
  description: string,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<SupplyStockCardItem>> => {
  const { systemUserId, sessionKey } = getAuthParams();

  const response = await axiosInstance.get<StockCardApiResponse>(
    `/Supply/item/grouped/stock-card/all/${encodeURIComponent(stockNumber)}/${encodeURIComponent(description)}`,
    {
      params: {
        ActionBySystemUserId: systemUserId,
        SessionKey: sessionKey,
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    }
  );

  if (!response.data.success) {
    toast.error(response.data.message || 'Failed to fetch stock card items');
    return { items: [], totalCount: 0, pageNumber, pageSize };
  }

  return {
    items: response.data.data.items,
    totalCount: response.data.data.totalCount,
    pageNumber: response.data.data.pageNumber,
    pageSize: response.data.data.pageSize,
  };
};