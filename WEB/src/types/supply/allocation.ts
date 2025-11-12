export interface ServiceAllocation {
  id: string;
  department: string;
  totalAllocation: number; // in currency or quantity depending on design
  totalIssued: number;
  lastUpdated?: string; // ISO date
  notes?: string;
}
