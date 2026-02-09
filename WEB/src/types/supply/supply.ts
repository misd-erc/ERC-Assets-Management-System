import { Category } from "@/api/categories/categoriesApi";
import { Vendor } from "../contract";

export interface SupplyItem {
  id: number;
  code: string;
  categoryId: number;
  description: string;
  measurementUnitId: number;
  currentStock: number;
  unitCost: number;
  reorderPoint: number;
  storageLocationId: number;
  vendorId: number;
  isActive: boolean;
  createdAt?: string;
}

export interface VwSupplyItem {
  id: number;
  code: string;
  category: Category | null;
  description: string;
  measurementUnit: SupplyUnit | null;
  currentStock: number;
  unitCost: number;
  reorderPoint: number;
  storageLocation: SupplyStorageLocation | null;
  vendor: Vendor | null;
  isActive: boolean;
  createdAt?: string;
}

export interface SupplyStorageLocation {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SupplyUnit {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

