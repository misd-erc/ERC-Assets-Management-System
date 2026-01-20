import { Part } from './UnifiedAsset';

export interface HistoryEntry {
  id: string;
  date: string;
  par_itr_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  actual_division: string | any;
  condition: string;
  remarks?: string;
}

export interface Movement {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  plantillaEmployeeIdOriginal: string;
  nonPlantillaEmployeeIdOriginal: string;
  employee?: Array<{
    id: number;
    systemUser: any;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffixName: string | null;
    employeeIdOriginal: string;
    employmentType?: { id: number; name: string; isActive: boolean; isDeleted: boolean; createdAt: string } | null;
    office: {
      id: number;
      name: string;
      acronym: string;
      generalCode: string | null;
      isActive: boolean;
      isDeleted: boolean;
      createdAt: string;
    } | null;
    division: {
      id: number;
      officeId: number;
      name: string;
      acronym: string;
      isActive: boolean;
      isDeleted: boolean;
      createdAt: string;
    } | null;
    position: any;
    isActive: boolean;
    createdAt: string;
  }>;
  office: any;
  division: any;
  condition: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface PPEAsset {
  id: number;
  group: string;
  propertyNumber: string;
  category: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  } | null;
  legend: string | null;
  description: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  parts: any[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: Movement[];
  estimatedUsefulLife: number;
  fiscalDate: string;
  history?: HistoryEntry[];
  dateEncoded?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}
