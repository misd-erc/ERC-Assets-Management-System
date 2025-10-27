import { User, LoginCredentials } from '../user';

// Backend view model interfaces matching C# models
export interface UserValidationViewModel {
  entraIdEncrypted: string;
  firstNameEncrypted: string;
  lastNameEncrypted: string;
  emailEncrypted: string;
}

export interface OTPValidationViewModel {
  systemUserIdEncrypted: string;
  otpEncrypted: string;
}

export interface SessionTokenValidationViewModel {
  KeyEncrypted: string;
  systemUserIdEncrypted: string;
}

export interface UserEncryptedPublicViewModel {
  systemUserIdEncrypted: string;
  firstNameEncrypted?: string;
  lastNameEncrypted?: string;
  emailEncrypted?: string;
  expiryTokenEncrypted?: string;
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
  systemUserIdEncrypted?: string;
}

export interface AuthActions {
  initialize: () => Promise<void>;
  login: (userInfo: { entraId: string; firstName: string; lastName: string; email: string }) => Promise<{ success: boolean; message: string }>;
  verifyMFA: (code: string) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  logout: () => void;
}

export type AuthStore = AuthState & AuthActions;
