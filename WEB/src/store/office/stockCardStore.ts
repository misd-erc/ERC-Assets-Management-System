import { create } from 'zustand';
import { toast } from 'sonner';
import { SupplyStockCardItem } from '@/types/supply/stockcard';
import { getStockCardItems } from '@/api/supply-management/stockCardApi';

interface StockCardState {
  stockCardItems: SupplyStockCardItem[];
  totalCount: number;
  loading: boolean;
  currentStockNumber: string;
  currentDescription: string;
  currentPage: number;
  pageSize: number;
  fetchStockCardItems: (stockNumber: string, description: string, page?: number) => Promise<void>;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useStockCardStore = create<StockCardState>((set, get) => ({
  stockCardItems: [],
  totalCount: 0,
  loading: false,
  currentStockNumber: '',
  currentDescription: '',
  currentPage: 1,
  pageSize: 10,

  fetchStockCardItems: async (stockNumber, description, page = 1) => {
    set({ loading: true, currentStockNumber: stockNumber, currentDescription: description, currentPage: page });
    try {
      const response = await getStockCardItems(stockNumber, description, page, get().pageSize);
      set({
        stockCardItems: response.items,
        totalCount: response.totalCount,
      });
    } catch (error) {
      toast.error('Failed to load stock card items');
    } finally {
      set({ loading: false });
    }
  },

  setPage: (page: number) => {
    const { currentStockNumber, currentDescription } = get();
    if (currentStockNumber && currentDescription) {
      get().fetchStockCardItems(currentStockNumber, currentDescription, page);
    }
  },

  reset: () => {
    set({
      stockCardItems: [],
      totalCount: 0,
      currentStockNumber: '',
      currentDescription: '',
      currentPage: 1,
      loading: false,
    });
  },
}));