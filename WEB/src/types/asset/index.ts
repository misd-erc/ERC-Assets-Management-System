export interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location?: string;
  acquisitionDate?: string;
  cost?: number;
}
