export interface Part {
  id: number;
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
  parItrNumber: string;
  plantillaEmployeeId: number | null;
  nonPlantillaEmployeeId: number | null;
  office: Office;
  division: Division;
  condition: string;
}

export interface Asset {
  id: number;
  group: "PPE" | "SE";
  propertyNumber: string;
  category: string | null;
  legend: string | null;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  parts: Part[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: UnifiedMovement[];
  estimatedUsefulLife: number | null;
}

export type AssetGroup = "PPE" | "SE";
