import axiosInstance from '../../lib/axios';
import { StockCardEntry } from '../../types/supply/stockCard';

export const getStockCards = async (): Promise<StockCardEntry[]> => {
  const { data } = await axiosInstance.get('/stock-cards');
  return data;
};

export const createStockCardEntry = async (entry: Partial<StockCardEntry>): Promise<StockCardEntry> => {
  const { data } = await axiosInstance.post('/stock-cards', entry);
  return data;
};
