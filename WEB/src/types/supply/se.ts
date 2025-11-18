export interface SEAsset {
  id: string;
  se_property_number: string;
  category: string;
  legend: string;
  description: string;
  brand: string;
  model: string;
  serial_number: string;
  parts_accessories: string;
  unit_of_measurement: string;
  unit_value: number;
  date_acquired: string;
  warranty_status: 'In Warranty' | 'Expired' | 'Unknown';
  accountabilityBlocks: SEAccountabilityBlock[];
  movementHistory: SEMovementHistory[];
  rrspHistory: RRSPEntry[];
  dateEncoded: string;
  status: 'Active' | 'Returned' | 'Lost' | 'Unserviceable';
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
