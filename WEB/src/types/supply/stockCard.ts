export interface StockCardEntry {
  id: string;
  supplyId: string;
  date: string; // ISO
  referenceNumber: string;
  transactionType: 'Delivery' | 'Issuance' | 'Return' | 'Disposal' | 'Adjustment';
  quantityIn: number;
  quantityOut: number;
  balance: number;
  processedBy?: string;
  notes?: string;
}
