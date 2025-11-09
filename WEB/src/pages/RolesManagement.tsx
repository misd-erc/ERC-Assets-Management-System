import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';
import { Role } from '../types/roles';
import { PERMISSION_CATEGORIES } from '../constants/permissions';
import { RolesHeader } from '../components/roles-management/RolesHeader';
import { SearchAndSummary } from '../components/roles-management/SearchAndSummary';
import { RolesTable } from '../components/roles-management/RolesTable';
import { RoleDialog } from '../components/roles-management/RoleDialog';
import { DeleteRoleDialog } from '../components/roles-management/DeleteRoleDialog';

export function RolesManagement() {
  const { systemUserId } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      roleId: 'ROLE-001',
      roleName: 'Administrator',
      description: 'Full system access with all permissions',
      assignedPermissions: Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id),
      userCount: 3,
      dateCreated: '2024-01-15'
    },
    {
      id: '2',
      roleId: 'ROLE-002',
      roleName: 'Property Custodian',
      description: 'Manages assets, supplies, and property accountability',
      assignedPermissions: ['categories', 'deliveries', 'supplies', 'ppe', 'par-ics', 'transfers', 'disposals', 'reports'],
      userCount: 8,
      dateCreated: '2024-02-01'
    },
    {
      id: '3',
      roleId: 'ROLE-003',
      roleName: 'Approver',
      description: 'Approval workflow access and basic viewing',
      assignedPermissions: ['approvals', 'reports'],
      userCount: 5,
      dateCreated: '2024-02-15'
    },
    {
      id: '4',
      roleId: 'ROLE-004',
      roleName: 'End User',
      description: 'Basic access for asset viewing and requests',
      assignedPermissions: ['supplies'],
      userCount: 12,
      dateCreated: '2024-03-01'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.roleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRole = (roleData: Omit<Role, 'id' | 'roleId' | 'userCount' | 'dateCreated'>) => {
    const roleId = `ROLE-${String(roles.length + 1).padStart(3, '0')}`;
    const role: Role = {
      id: Date.now().toString(),
      roleId,
      ...roleData,
      userCount: 0,
      dateCreated: new Date().toISOString().split('T')[0]
    };

    setRoles([...roles, role]);
    toast.success('Role created successfully');
  };

  const handleEditRole = (roleData: Omit<Role, 'id' | 'roleId' | 'userCount' | 'dateCreated'>) => {
    if (!editingRole) return;

    setRoles(roles.map(role =>
      role.id === editingRole.id ? { ...role, ...roleData } : role
    ));
    setEditingRole(null);
    toast.success('Role updated successfully');
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(role => role.id !== roleId));
    setDeleteRoleId(null);
    toast.success('Role deleted successfully');
  };

  return (
    <div className="pl-64 pt-16 space-y-8">
      <RolesHeader onAddRole={() => setShowAddRole(true)} />

      <SearchAndSummary
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalRoles={roles.length}
      />

      <RolesTable
        roles={filteredRoles}
        onEditRole={setEditingRole}
        onDeleteRole={setDeleteRoleId}
      />

      <RoleDialog
        isOpen={showAddRole}
        onClose={() => setShowAddRole(false)}
        onSave={handleAddRole}
        rolesCount={roles.length}
      />

      <RoleDialog
        isOpen={editingRole !== null}
        onClose={() => setEditingRole(null)}
        onSave={handleEditRole}
        editingRole={editingRole}
        rolesCount={roles.length}
      />

      <DeleteRoleDialog
        isOpen={deleteRoleId !== null}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={() => deleteRoleId && handleDeleteRole(deleteRoleId)}
      />
    </div>
  );
}
