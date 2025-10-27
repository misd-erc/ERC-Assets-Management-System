export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  entraId?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  divisionName?: string;
  officeName?: string;
  role?: string;
  status?: string;
  profileImage?: string;
  profilePictureId?: string;
  employeeId?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Microsoft MSAL account info
export interface MSALAccountInfo {
  homeAccountId: string;
  environment: string;
  tenantId: string;
  username: string;
  localAccountId: string;
  name?: string;
  entraId?: string;
}
