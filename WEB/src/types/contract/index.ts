export interface Contract {
  id: string;
  title: string;
  vendor: string;
  status: 'active' | 'expired' | 'terminated';
  startDate: Date;
  endDate: Date;
  value: number;
}
