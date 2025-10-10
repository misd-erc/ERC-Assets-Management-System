import { User, LoginCredentials } from '../user';

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
