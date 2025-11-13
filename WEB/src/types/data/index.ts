import { Asset } from '@/types/asset';
import { SupplyItem } from '@/types/supply/supply';
import { RISRequest } from '@/types/supply/ris';
import { Contract } from '@/types/contract';

export interface DataStore {
  assets: Asset[];
  supplies: SupplyItem[];
  risRequests: RISRequest[];
  contracts: Contract[];

  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  addSupply: (supply: Omit<SupplyItem, 'id'>) => void;
  updateSupply: (id: string, updates: Partial<SupplyItem>) => void;
  removeSupply: (id: string) => void;

  addRISRequest: (request: Omit<RISRequest, 'id'>) => void;
  updateRISRequest: (id: string, updates: Partial<RISRequest>) => void;
  removeRISRequest: (id: string) => void;
}

