import { create } from 'zustand';
import { DataStore, Asset, SupplyItem, RISRequest, Contract } from '../../types';

export const useDataStore = create<DataStore>((set, get) => ({
  assets: [
    { id: '1', name: 'Laptop', category: 'IT Equipment', status: 'Active', location: 'IT Department' },
    { id: '2', name: 'Printer', category: 'Office Equipment', status: 'Active', location: 'Admin Office' },
  ],
  supplies: [
    { id: '1', name: 'Paper', quantity: 100, unit: 'reams', minThreshold: 20 },
    { id: '2', name: 'Ink', quantity: 50, unit: 'bottles', minThreshold: 10 },
  ],
  risRequests: [
    { 
      id: '1', 
      status: 'pending',
      requester: 'John Doe',
      department: 'Finance',
      items: [{ id: 'item1', name: 'Paper', quantity: 50 }],
      dateRequested: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    { 
      id: '2', 
      status: 'approved',
      requester: 'Jane Smith',
      department: 'IT',
      items: [{ id: 'item2', name: 'Ink', quantity: 20 }],
      dateRequested: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dateApproved: new Date()
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
      value: 500000
    },
  ],

  addAsset: (asset) => {
    const newAsset = { ...asset, id: Date.now().toString() };
    set((state) => ({ assets: [...state.assets, newAsset] }));
  },

  updateAsset: (id, updates) => {
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.id === id ? { ...asset, ...updates } : asset
      ),
    }));
  },

  removeAsset: (id) => {
    set((state) => ({
      assets: state.assets.filter((asset) => asset.id !== id),
    }));
  },

  addSupply: (supply) => {
    const newSupply = { ...supply, id: Date.now().toString() };
    set((state) => ({ supplies: [...state.supplies, newSupply] }));
  },

  updateSupply: (id, updates) => {
    set((state) => ({
      supplies: state.supplies.map((supply) =>
        supply.id === id ? { ...supply, ...updates } : supply
      ),
    }));
  },

  addRISRequest: (request) => {
    const newRequest = { ...request, id: Date.now().toString() };
    set((state) => ({ risRequests: [...state.risRequests, newRequest] }));
  },

  updateRISRequest: (id, updates) => {
    set((state) => ({
      risRequests: state.risRequests.map((request) =>
        request.id === id ? { ...request, ...updates } : request
      ),
    }));
  },
}));
