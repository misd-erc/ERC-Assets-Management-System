import { Division, Office, EmploymentType, Position } from "@/types/office";

export interface ProfilePictureStorageFile {
  id: number;
  blobName: string;
  originalFileName: string;
  folderName: string;
  contentType: string;
  uploadedAt: string;
  uploadedBy: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface SystemUserStatus {
  id: number;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  isActive: boolean;
  systemRole: SystemRole[];
  systemUserStatus: SystemUserStatus;
  office: Office | null;
  division: Division | null;
  employmentType?: EmploymentType | null;
  position?: Position | null;
  profilePictureStorageFile: ProfilePictureStorageFile | null;
  createdAt: string;
  lastLoginAt: string;
  entraId?: string;
}

export interface SystemRole {
  id: number;
  roleName: string;
  description: string;
  scope: SystemRoleScope[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  userCount: number;
}

export interface SystemRoleSimple {
  id: number;
  roleName: string;
  description: string;
  scope: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  userCount: number;
}

export interface SystemRoleScope {
  id: number;
  module: {
    id: number;
    name: string;
    acronym: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  };
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}
export interface UserDetails {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  isActive: boolean;
  systemRole: SystemRole[];
  systemUserStatus: SystemUserStatus;
  office: Office | null;
  division: Division | null;
  employmentType?: EmploymentType | null;
  position?: Position | null;
  profilePictureStorageFile: ProfilePictureStorageFile | null;
  createdAt: string;
  lastLoginAt: string;
  profilePictureId?: string;
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

export interface Employee {
  id: number;
  systemUserId: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffixName: string;
  employeeIdOriginal: string;
  officeId: number;
  divisionId: number;
  positionId: number;
  employmentTypeId: number;
  isActive: boolean;
  createdAt: string;
}


