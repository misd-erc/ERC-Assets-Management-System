import { User, LoginCredentials } from '../user';

// Backend view model interfaces matching C# models
export interface UserValidationViewModel {
  EntraIdEncrypted: string;
  FirstNameEncrypted: string;
  LastNameEncrypted: string;
  EmailEncrypted: string;
}

export interface OTPValidationViewModel {
  SystemUserIdEncrypted: string;
  OTPEncrypted: string;
}

export interface SessionTokenValidationViewModel {
  KeyEncrypted: string;
  SystemUserIdEncrypted: string;
}

export interface UserEncryptedPublicViewModel {
  SystemUserIdEncrypted: string;
  FirstNameEncrypted?: string;
  LastNameEncrypted?: string;
  EmailEncrypted?: string;
  ExpiryTokenEncrypted?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  requireMFA: boolean;
  loading: boolean;
  error: string;
  systemUserIdEncrypted?: string;
}

export interface AuthActions {
  initialize: () => Promise<void>;
  login: (userInfo: { entraId: string; firstName: string; lastName: string; email: string }) => Promise<boolean>;
  verifyMFA: (code: string) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;
