export interface PPEAsset {
  id: string;
  property_number: string;
  category: string;
  legend: string;
  description: string;
  brand: string;
  model: string;
  serial_number: string;
  parts: string;
  unit_of_measurement: string;
  unit_value: number;
  date_acquired: string;
  estimated_useful_life: number;
  date: string;
  par_itr_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  actual_division: string;
  condition: PPECondition;
  dateEncoded: string;
  history: PPEHistory[];
}

export interface PPEHistory {
  id: string;
  date: string;
  par_itr_number: string;
  plantilla_employee_id: string;
  non_plantilla_employee_id: string;
  actual_division: string;
  condition: PPECondition;
  remarks: string;
}

export type PPECondition =
  | 'Working'
  | 'Not Working'
  | 'IIRUP'
  | 'Disposed'
  | 'Missing';

export type PPECategory =
  | 'ICT Equipment'
  | 'Office Equipment'
  | 'Motor Vehicle'
  | 'Furniture and Fixtures'
  | 'Communication Equipment'
  | 'Technical and Scientific Equipment'
  | 'Sports Equipment';

export type PPELegend =
  | 'A'
  | 'B'
  | 'C'
  | 'F'
  | 'I'
  | 'M'
  | 'O'
  | 'T';

export type PPEUnitOfMeasurement =
  | 'unit'
  | 'set'
  | 'piece'
  | 'lot';

export type PPEDivision =
  | 'Office of the Chairman and CEO'
  | 'Legal Service'
  | 'Administrative Service'
  | 'Finance Service'
  | 'Technical Service'
  | 'Planning and Policy Service';
