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
  id: number | null;
  ptaId: number;
  dateAssigned: string;
  ptrItrNumber: string;
  parIcsNumber: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  plantillaEmployeeIdOriginal?: string | null;
  nonPlantillaEmployeeIdOriginal?: string | null;
  employee?: Array<{
    id: number;
    firstName: string;
    middleName: string | null;
    lastName: string;
    suffixName?: string | null;
    employeeIdOriginal?: string | null;
    employmentType?: { id: number; name: string } | null;
    office: {
      id: number;
      name: string;
      acronym: string;
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
  }>;
  actualOfficeId?: number;
  actualDivisionId?: number;
  condition: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Asset {
  id: number;
  group: "PPE" | "SE";
  propertyNumber: string;

  categoryId: number;   // number always
  legendId: number;     // number always

  category?: string;    // optional string from lookup
  legend?: string;      // optional string from lookup

  condition: string;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  parts: Part[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  estimatedUsefulLife: number;
  fiscalDate: string;
  movements: UnifiedMovement[];
}

export type AssetGroup = "PPE" | "SE";
