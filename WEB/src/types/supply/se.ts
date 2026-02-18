export interface SEAsset {
  id?: string | number;
  ptaId?: string | number;
  PTAId?: string | number;
  propertyNumber?: string | null;
  code?: string | null;
  description?: string | null;
  categoryId?: number | null;
  legendId?: number | null;
  category?: string | null;
  legend?: string | null;
  brand?: string | null;
  model?: string | null;
  location?: string | null;
  serialNumber?: string | null;
  parts?: any[] | null;
  unitOfMeasurement?: string | null;
  unitValue?: number | null;
  dateAcquired?: string | null;
  estimatedUsefulLife?: number | null;
  group?: string | null;
  movements?: any[] | null;
  isActive?: boolean;
  createdAt?: string;
  lastModified?: string;
}
