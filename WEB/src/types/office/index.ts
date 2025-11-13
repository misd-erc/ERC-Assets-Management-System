import { User } from "@/user";

export interface Office {
  id: number;
  name: string;
  acronym: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface VwOffice {
  id: number;
  name: string;
  acronym: string;
  users: User[];
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}


export interface Division {
  id: number;
  name: string;
  officeId: number;
  acronym: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface VwDivision {
  id: number;
  name: string;
  office: Office | null;
  users: User[];
  acronym: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string; 
}

export interface EmploymentType {
  id: number;
  name: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface VwEmploymentType {
  id: number;
  name: string;
  users: User[];
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface Position {
  id: number;
  name: string;
  acronym: string;
  salaryGrade: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface VwPosition {
  id: number;
  name: string;
  acronym: string;
  salaryGrade: string;
  users: User[];
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}
