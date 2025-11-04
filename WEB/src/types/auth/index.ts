import { User, LoginCredentials } from '../user';

// Backend view model interfaces matching C# models
export interface UserValidationViewModel {
  entraId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
}

export interface OTPValidationViewModel {
  systemUserId: string;
  otp: string;
}

export interface SessionTokenValidationViewModel {
  Key: string;
  systemUserId: string;
}

export interface UserPublicViewModel {
  systemUserId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  expiryToken?: string;
  sessionKey?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  requireMFA: boolean;
  loading: boolean;
  error: string;
  systemUserId?: string;
  plainSystemUserId?: string;
}

export interface AuthActions {
  initialize: () => Promise<void>;
  login: (userInfo: { entraId: string; firstName: string; lastName: string; email: string; employeeId?: string }) => Promise<{ success: boolean; message: string }>;
  verifyMFA: (code: string) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;
