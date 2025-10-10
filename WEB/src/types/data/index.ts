import { Asset } from '../asset';
import { SupplyItem } from '../supply';
import { RISRequest } from '../ris';
import { Contract } from '../contract';

export interface DataState {
  assets: Asset[];
  supplies: SupplyItem[];
  risRequests: RISRequest[];
  contracts: Contract[];
}

export interface DataActions {
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  addSupply: (supply: Omit<SupplyItem, 'id'>) => void;
  updateSupply: (id: string, updates: Partial<SupplyItem>) => void;
  addRISRequest: (request: Omit<RISRequest, 'id'>) => void;
  updateRISRequest: (id: string, updates: Partial<RISRequest>) => void;
}

export type DataStore = DataState & DataActions;
