import { create } from 'zustand';

interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
}

interface SupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface RISRequest {
  id: string;
  status: string;
  // other fields
}

interface Contract {
  id: string;
  // other fields
}

interface DataState {
  assets: Asset[];
  supplies: SupplyItem[];
  risRequests: RISRequest[];
  contracts: Contract[];
}

export const useDataStore = create<DataState>(() => ({
  assets: [
    { id: '1', name: 'Laptop', category: 'IT Equipment', status: 'Active' },
    { id: '2', name: 'Printer', category: 'Office Equipment', status: 'Active' },
  ],
  supplies: [
    { id: '1', name: 'Paper', quantity: 100, unit: 'reams' },
    { id: '2', name: 'Ink', quantity: 50, unit: 'bottles' },
  ],
  risRequests: [
    { id: '1', status: 'Pending' },
    { id: '2', status: 'Approved' },
  ],
  contracts: [
    { id: '1' },
  ],
}));
