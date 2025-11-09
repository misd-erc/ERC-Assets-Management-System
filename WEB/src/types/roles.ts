export interface Role {
  id: string;
  roleId: string;
  roleName: string;
  description: string;
  assignedPermissions: string[];
  userCount: number;
  dateCreated: string;
}

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
  icon: any;
}
