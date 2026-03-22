export interface ApiEmployee {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffixName?: string | null;
  employeeIdOriginal?: string | null;
  employmentType?: { id: number; name: string } | null;
  office?: { id: number; name: string; acronym: string } | null;
  position?: { id: number; name: string } | null;
  // keep other fields as optional
}

export interface NormalizedEmployee {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffixName: string;
  employeeIdOriginal: string;
  employmentTypeId: number;
  employmentTypeName: string;
  label: string;
}

export interface Employee {
  employeeId: number;
  employeeFirstName: string;
  employeeLastName: string;
  employeeMiddleName?: string | null;
  employeeSuffixName?: string | null;
  employmentTypeId: number;
}

export interface Part {
  id: number | null;
  ptaId: number;
  name: string;
  serialNumber: string;
  isActive: boolean;
}

export interface Office {
  id: number;
  name: string;
  acronym: string;
}

export interface Division {
  id: number;
  name: string;
  acronym: string;
}

export interface UnifiedMovement {
  id: number;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  rrppeRrspNumber?: string;
  status?: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  plantillaEmployeeIdOriginal?: string;
  nonPlantillaEmployeeIdOriginal?: string;
  actualOfficeId?: number;
  actualDivisionId?: number;
  isCurrent?: boolean;
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
  office?: any;
  division?: any;
  condition: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Asset {
  id: number;
  group: "PPE" | "SE";
  propertyNumber: string;
  category: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  };
  legend: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  } | null;
  description: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  parts: Part[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: UnifiedMovement[];
  estimatedUsefulLife: number;
  fiscalDate: string;
  condition?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface FormAsset {
  group: "PPE" | "SE";
  propertyNumber: string;
  categoryId: number;
  legendId: number;
  description: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  parts: Part[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: UnifiedMovement[];
  estimatedUsefulLife: number;
  fiscalDate: string;
  condition?: string;
  category?: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  };
  legend?: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  } | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
}

export type AssetGroup = "PPE" | "SE";
