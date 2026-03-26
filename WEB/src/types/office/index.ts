import { User } from "@/types/user";

export interface Office {
  id: number;
  name: string;
  acronym: string;
  generalCode?: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface VwOffice {
  id: number;
  name: string;
  acronym: string;
  generalCode?: string;
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

export interface EmployeeDetail {
  id: number;
  systemUser: import('@/types/user').User | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffixName: string | null;
  employeeIdOriginal: string;
  office: Office | null;
  division: Division | null;
  employmentType: EmploymentType | null;
  position: Position | null;
  isActive: boolean;
  createdAt: string;
}
