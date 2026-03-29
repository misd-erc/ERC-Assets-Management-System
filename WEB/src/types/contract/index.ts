export interface Contract {
  id: string;
  title: string;
  vendor: string;
  status: 'active' | 'expired' | 'terminated';
  startDate: Date;
  endDate: Date;
  value: number;
}

export interface Vendor {
  id: number;
  name: string;
  address: string;
  email: string;
  contact: string;
  contactPerson: string;
  isActive: boolean;
  createdAt?: string;
}
