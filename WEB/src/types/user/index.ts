export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  systemRoleName: string;
  position?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  department?: string;
  dateCreated?: string;
  lastLogin?: string;
  entraId?: string;
  firstName?: string;
  lastName?: string;
  officeId?: string;
  divisionId?: string;
  employmentTypeId?: string;
  positionId?: string;
  officeName?: string;
  divisionName?: string;
  profilePictureStorageFileId?: number;
}

export interface Office {
  id: number;
  name: string;
  acronym: string;
  isActive: boolean;
}

export interface Division {
  id: number;
  name: string;
  officeId: number;
  acronym: string;
}

export interface EmploymentType {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  name: string;
}

export interface SystemRole {
  id: number;
  roleName: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
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
  systemRoleId?: string;
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
