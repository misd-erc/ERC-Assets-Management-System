import { Division, Office } from "@/office";

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
  profilePictureStorageFile: ProfilePictureStorageFile | null;
  createdAt: string;
  lastLoginAt: string;
  entraId?: string;
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
  employeeId: string;
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

