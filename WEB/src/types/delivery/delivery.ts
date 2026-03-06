import { Employee, SupplyIAR, SupplyUnit, Vendor, VwSupplyIAR } from "@/types";
import { Category } from "@/api/categories/categoriesApi";

export interface DeliveryRecord {
  id: number;
  drNumber: string;
  supplyIARId: number;
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
  supplyIAR: VwSupplyIAR;
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