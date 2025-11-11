export interface SupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  unitCost?: number;
  totalValue?: number;
  location?: string;
  supplier?: string;
  lastRestocked?: string;
  category?: string;
  description?: string;
}
