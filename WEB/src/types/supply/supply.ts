import { Category } from "@/api/categories/categoriesApi";
import { Contract, Vendor } from "../contract";
import { Division, Office } from "../office";
import {VwDeliveryRecord} from "@/types/delivery/delivery";

export interface SupplyItem {
  id: number;
  code: string;
  categoryId: number;
  description: string;
  measurementUnitId: number;
  currentStock: number;
  quantity: number;
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
  iarId: number | null;
  category: Category | null;
  description: string;
  measurementUnit: SupplyUnit | null;
  currentStock: number;
  quantity: number;
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

export interface SupplyIAR {
  id: number;
  centerCode: string;
  entityName: string;
  fundCluster: string;
  vendorId: number;
  poNumber: string;
  officeId: number;
  divisionId: number;
  iarNumber: string;
  iarNumberDate: string;
  iarInvoiceNumber: string;
  iarInvoiceNumberDate: string;
  poDate: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt?: string;
}

export interface VwSupplyIAR {
  id: number;
  centerCode: string;
  entityName: string;
  fundCluster: string;
  vendor: Vendor;
  poNumber: string;
  office: Office;
  division: Division;
  iarNumber: string;
  iarNumberDate: string;
  iarInvoiceNumber: string;
  iarInvoiceNumberDate: string;
  poDate: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt?: string;
  approvedOn?: string;
}