export interface Part {
  id: number;
  name: string;
  serialNumber: string;
}

export interface UnifiedMovement {
  id: string;
  parItrNumber: string;
  plantillaEmployeeId: string;
  nonPlantillaEmployeeId: string;
  officeId: string;
  divisionId: string;
  condition: string;
  dateAssigned: string;
}

export interface Asset {
  id: string;
  group: "PPE" | "SE";
  propertyNumber: string;
  category: string;
  legend: string;
  description: string;
  brand: string;
  model: string;
  serialNumber: string;
  parts: Part[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  estimatedUsefulLife: number;
  condition: string;
  actualDivision: string;
  movements: UnifiedMovement[];
  history: UnifiedMovement[];
}

export type AssetGroup = "PPE" | "SE";
