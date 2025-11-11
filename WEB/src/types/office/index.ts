export interface Office {
  id: number;
  name: string;
  acronym: string;
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

export interface Position {
  id: number;
  name: string;
  acronym: string;
  salaryGrade: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}