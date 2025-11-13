import { create } from 'zustand';
import { DataStore, Asset, SupplyItem, RISRequest, Contract } from '@/types';

export const useDataStore = create<DataStore>((set) => ({
  // ---------- Initial Data ----------
  assets: [
    {
      id: '1',
      name: 'Laptop',
      category: 'IT Equipment',
      status: 'Active',
      location: 'IT Department',
    },
    {
      id: '2',
      name: 'Printer',
      category: 'Office Equipment',
      status: 'Active',
      location: 'Admin Office',
    },
  ],

  supplies: [
    {
      id: '1',
      stockNumber: 'STK-001',
      itemCode: 'ITM-001',
      description: 'Bond Paper',
      category: 'Office Supplies',
      unit: 'Ream',
      currentStock: 100,
      reorderPoint: 20,
      unitCost: 150,
      location: 'Storage Room A',
      supplier: 'PaperOne Supplier',
      totalValue: 150 * 100,
      lastRestocked: new Date().toISOString(),
    },
    {
      id: '2',
      stockNumber: 'STK-002',
      itemCode: 'ITM-002',
      description: 'Printer Ink',
      category: 'Office Supplies',
      unit: 'Bottle',
      currentStock: 50,
      reorderPoint: 10,
      unitCost: 200,
      location: 'Storage Room A',
      supplier: 'Inktec Supplies',
      totalValue: 50 * 200,
      lastRestocked: new Date().toISOString(),
    },
  ],

  risRequests: [
    {
      id: '1',
      risNumber: 'RIS-001',
      requester: 'John Doe',
      department: 'Finance',
      dateRequested: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'item1',
          supplyId: '1',
          description: 'Bond Paper',
          unit: 'Ream',
          quantityRequested: 50,
        },
      ],
      status: 'pending',
    },
    {
      id: '2',
      risNumber: 'RIS-002',
      requester: 'Jane Smith',
      department: 'IT',
      dateRequested: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'item2',
          supplyId: '2',
          description: 'Printer Ink',
          unit: 'Bottle',
          quantityRequested: 20,
        },
      ],
      status: 'approved',
      approvedBy: 'Manager A',
      approvedDate: new Date().toISOString(),
    },
  ],

  contracts: [
    {
      id: '1',
      title: 'IT Equipment Supply Contract',
      vendor: 'TechCorp Inc.',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      value: 500000,
    },
  ],

  // ---------- Asset Actions ----------
  addAsset: (asset: Omit<Asset, 'id'>) => {
    const newAsset = { ...asset, id: Date.now().toString() };
    set((state) => ({ assets: [...state.assets, newAsset] }));
  },

  updateAsset: (id: string, updates: Partial<Asset>) => {
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      ),
    }));
  },

  removeAsset: (id: string) => {
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
    }));
  },

  // ---------- Supply Actions ----------
  addSupply: (supply: Omit<SupplyItem, 'id'>) => {
    const newSupply = { ...supply, id: Date.now().toString() };
    set((state) => ({ supplies: [...state.supplies, newSupply] }));
  },

  updateSupply: (id: string, updates: Partial<SupplyItem>) => {
    set((state) => ({
      supplies: state.supplies.map((supply) =>
        supply.id === id ? { ...supply, ...updates } : supply
      ),
    }));
  },

  removeSupply: (id: string) => {
    set((state) => ({
      supplies: state.supplies.filter((supply) => supply.id !== id),
    }));
  },

  // ---------- RIS Request Actions ----------
  addRISRequest: (request: Omit<RISRequest, 'id'>) => {
    const newRequest = { ...request, id: Date.now().toString() };
    set((state) => ({ risRequests: [...state.risRequests, newRequest] }));
  },

  updateRISRequest: (id: string, updates: Partial<RISRequest>) => {
    set((state) => ({
      risRequests: state.risRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    }));
  },

  removeRISRequest: (id: string) => {
    set((state) => ({
      risRequests: state.risRequests.filter((req) => req.id !== id),
    }));
  },
}));

