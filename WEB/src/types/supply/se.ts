export interface SEAsset {
  id: number;
  group: string;
  propertyNumber: string;
  category: {
    id: number;
    name: string;
    generalCode: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  };
  legend: string | null;
  description: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  parts: any[];
  unitOfMeasurement: string;
  unitValue: number;
  dateAcquired: string;
  movements: Array<{
    id: number;
    ptaId: number;
    dateAssigned: string;
    ptrItrNumber: string;
    parIcsNumber: string;
    plantillaEmployeeId: number | null;
    nonPlantillaEmployeeId: number | null;
    plantillaEmployeeIdOriginal: string;
    nonPlantillaEmployeeIdOriginal: string;
    employee: Array<{
      id: number;
      systemUser: any;
      firstName: string;
      middleName: string | null;
      lastName: string;
      suffixName: string | null;
      employeeIdOriginal: string;
      office: {
        id: number;
        name: string;
        acronym: string;
        generalCode: string | null;
        isActive: boolean;
        isDeleted: boolean;
        createdAt: string;
      };
      division: {
        id: number;
        officeId: number;
        name: string;
        acronym: string;
        isActive: boolean;
        isDeleted: boolean;
        createdAt: string;
      };
      employmentType: {
        id: number;
        name: string;
        isActive: boolean;
        isDeleted: boolean;
        createdAt: string;
      };
      position: any;
      isActive: boolean;
      createdAt: string;
    }>;
    office: any;
    division: any;
    condition: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
  }>;
  estimatedUsefulLife: number;
  fiscalDate: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface SEAccountabilityBlock {
  id: string;
  itr_rrsp_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  division_section: string;
  condition: string;
  date_issued_returned: string;
  remarks: string;
  label: 'Current Holder' | 'Previous Holder' | 'Original Holder';
  type: 'ITR' | 'RRSP';
}

export interface SEMovementHistory {
  id: string;
  type: 'Issuance' | 'Return' | 'Transfer' | 'Condition Change' | 'Lost' | 'Unserviceable';
  date: string;
  from_employee?: string;
  to_employee: string;
  condition: string;
  remarks: string;
  documentNumber: string;
}

export interface RRSPEntry {
  id: string;
  rrsp_number: string;
  se_property_number: string;
  employee_returning: string;
  condition_on_return: string;
  findings: string;
  verified_by: string;
  date_returned: string;
  photos?: string[];
}

export type SEStatus = 'Active' | 'Returned' | 'Lost' | 'Unserviceable';

export type SECondition = 'Working' | 'Not Working' | 'For Repair' | 'Lost' | 'Unserviceable';

export type SEWarrantyStatus = 'In Warranty' | 'Expired' | 'Unknown';

export type SECategory =
  | 'ICT Equipment'
  | 'Furniture'
  | 'Tools'
  | 'Sports Equipment'
  | 'Linen'
  | 'Office Supplies'
  | 'Communication Equipment';

export type SEUnitOfMeasurement =
  | 'unit'
  | 'set'
  | 'piece'
  | 'lot';

export type SEMovementType =
  | 'Issuance'
  | 'Return'
  | 'Transfer'
  | 'Condition Change'
  | 'Lost'
  | 'Unserviceable';
