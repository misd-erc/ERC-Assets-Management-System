export interface Movement {
  id: number;
  ppeId: number;
  dateAssigned: string;
  parItrNumber: string | null;
  plantillaEmployeeId: string | null;
  nonPlantillaEmployeeId: string | null;
  plantillaEmployeeIdOriginal: string | null;
  nonPlantillaEmployeeIdOriginal: string | null;
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
  condition: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface PPEAsset {
  id: string;
  propertyNumber: string;
  category: any;
  legend: any;
  description: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  parts?: string[] | null;
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: Movement[];
  estimatedUsefulLife: number;
  parItrNumber?: string | null;
  plantillaEmployeeId?: string | null;
  nonPlantillaEmployeeId?: string | null;
  actualDivision?: any;
  condition: string;
  date: string;
  history?: any[];
  dateEncoded: string;
}
