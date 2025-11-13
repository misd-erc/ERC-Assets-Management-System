import { create } from 'zustand';
import { SupplyItem } from '@/types/supply/supply';
import { StockCardEntry } from '@/types/supply/stockCard';
import { ServiceAllocation } from '@/types/supply/allocation';
import { RISRequest } from '@/types/supply/ris';

type State = {
  supplies: SupplyItem[];
  stockCards: StockCardEntry[];
  allocations: ServiceAllocation[];
  risRequests: RISRequest[];

  setSupplies: (supplies: SupplyItem[]) => void;
  addSupply: (supply: SupplyItem) => void;
  updateSupply: (id: string, patch: Partial<SupplyItem>) => void;
  deleteSupply: (id: string) => void;

  setStockCards: (cards: StockCardEntry[]) => void;
  addStockCard: (entry: StockCardEntry) => void;

  setAllocations: (allocs: ServiceAllocation[]) => void;
  addAllocation: (alloc: ServiceAllocation) => void;
  updateAllocation: (id: string, patch: Partial<ServiceAllocation>) => void;

  setRISRequests: (requests: RISRequest[]) => void;
  addRISRequest: (request: RISRequest) => void;
  updateRISRequest: (id: string, patch: Partial<RISRequest>) => void;
};

export const useSupplyStore = create<State>((set) => ({
  supplies: [],
  stockCards: [],
  allocations: [],
  risRequests: [],

  setSupplies: (supplies) => set({ supplies }),
  addSupply: (supply) => set((state) => ({ supplies: [supply, ...state.supplies] })),
  updateSupply: (id, patch) =>
    set((state) => ({
      supplies: state.supplies.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),
  deleteSupply: (id) =>
    set((state) => ({
      supplies: state.supplies.filter((x) => x.id !== id),
    })),

  setStockCards: (cards) => set({ stockCards: cards }),
  addStockCard: (entry) => set((state) => ({ stockCards: [entry, ...state.stockCards] })),

  setAllocations: (allocs) => set({ allocations: allocs }),
  addAllocation: (alloc) => set((state) => ({ allocations: [alloc, ...state.allocations] })),
  updateAllocation: (id, patch) =>
    set((state) => ({
      allocations: state.allocations.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      ),
    })),

  setRISRequests: (requests) => set({ risRequests: requests }),
  addRISRequest: (request) =>
    set((state) => ({ risRequests: [request, ...state.risRequests] })),
  updateRISRequest: (id, patch) =>
    set((state) => ({
      risRequests: state.risRequests.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      ),
    })),
}));



