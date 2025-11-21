export interface Role {
  id: number;
  roleName: string;
  description: string;
  scope: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  userCount: number;
}

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: any;
}
