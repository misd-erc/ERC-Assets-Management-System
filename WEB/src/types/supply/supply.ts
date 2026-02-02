export type UnitType = 'Piece' | 'Box' | 'Ream' | 'Pack' | 'Bottle' | 'Kilogram' | 'Liter';

export interface SupplyItem {
  id: string;
  stockNumber: string;
  itemCode: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  unitCost: number;
  location: string;
  supplier: string;
  totalValue?: number;
  lastRestocked?: string;
}
