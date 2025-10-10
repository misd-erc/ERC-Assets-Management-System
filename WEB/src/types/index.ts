export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  requireMFA: boolean;
  loading: boolean;
  error: string;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location?: string;
  acquisitionDate?: string;
  cost?: number;
}

export interface SupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
}

export interface RISRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requester: string;
  department: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  dateRequested: Date;
  dateApproved?: Date;
}

export interface Contract {
  id: string;
  title: string;
  vendor: string;
  status: 'active' | 'expired' | 'terminated';
  startDate: Date;
  endDate: Date;
  value: number;
}

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
