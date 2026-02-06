import { Employee, SupplyUnit, Vendor } from "@/types";
import { Category } from "@/api/categories/categoriesApi";

export interface DeliveryRecord {
  id: number;
  drNumber: string;
  poNumber: string;
  vendorId: number;
  deliveryDate: string;
  employeeId: number;
  remarks: string;
  isReceived: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface DeliveryRecordItem {
  id: number;
  recordId: number;
  itemTypeId: number;
  category: Category;
  itemDescription: string;
  itemSpecification: string;
  itemQuantity: number;
  measurementUnit: SupplyUnit;
  unitCost: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
}

export interface VwDeliveryRecord {
  id: number;
  drNumber: string;
  poNumber: string;
  vendor: Vendor;
  deliveryDate: string;
  employee: Employee;
  remarks: string;
  isReceived: boolean;
  items: DeliveryRecordItem[];
  isActive: boolean;
  createdAt?: string;
}

export interface EditDeliveryRecord {
  deliveryRecord: DeliveryRecord;
  items: DeliveryRecordItem[];
}