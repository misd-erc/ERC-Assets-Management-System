import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useRolesStore } from '../store/roles';
import { Role } from '../types/roles';
import { PERMISSION_CATEGORIES } from '../constants/permissions';
import { RolesHeader } from '../components/roles-management/RolesHeader';
import { SearchAndSummary } from '../components/roles-management/SearchAndSummary';
import { RolesTable } from '../components/roles-management/RolesTable';
import { RoleDialog } from '../components/roles-management/RoleDialog';
import { DeleteRoleDialog } from '../components/roles-management/DeleteRoleDialog';

export function RolesManagement() {
  const { systemUserId } = useAuthStore();
  const { roles, loading, error, totalCount, fetchRoles, createOrUpdateRole } = useRolesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

 
  useEffect(() => {
    if (systemUserId) {
      console.log('[RolesManagement] Fetching roles with systemUserId:', systemUserId);
      fetchRoles({
        pageNumber: 1,
        pageSize: 10,
        actionBySystemUserId: systemUserId,
      });
    } else {
      console.log('[RolesManagement] No systemUserId available, checking localStorage...');
      const storedSystemUserId = localStorage.getItem('systemUserId');
      if (storedSystemUserId) {
        console.log('[RolesManagement] Found systemUserId in localStorage:', storedSystemUserId);
        fetchRoles({
          pageNumber: 1,
          pageSize: 10,
          actionBySystemUserId: storedSystemUserId,
        });
      } else {
        console.log('[RolesManagement] No systemUserId found anywhere');
      }
    }
  }, [systemUserId, fetchRoles]);

  // Convert API roles to frontend Role format
  const frontendRoles: Role[] = Array.isArray(roles) ? roles.map(apiRole => ({
    id: apiRole.id.toString(),
    roleId: `ROLE-${apiRole.id.toString().padStart(3, '0')}`,
    roleName: apiRole.roleName,
    description: apiRole.description,
    assignedPermissions: (apiRole.scope || [])
      .filter((scope: any) => scope.isActive)
      .map((scope: any) => scope.module?.toLowerCase().replace(/\s+/g, '-') || 'unknown'),
    userCount: apiRole.userCount,
    dateCreated: new Date(apiRole.createdAt).toISOString().split('T')[0]
  })) : [];

  // Filter roles based on search
  const filteredRoles = frontendRoles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.roleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRole = async (roleData: Omit<Role, 'id' | 'roleId' | 'userCount' | 'dateCreated'>) => {
    const userId = systemUserId || localStorage.getItem('systemUserId');
    if (!userId) {
      console.error('[RolesManagement] No systemUserId available for creating role');
      return;
    }

    console.log('[RolesManagement] Creating role with userId:', userId);

    // Convert permissions back to scopes format
    const scopes = roleData.assignedPermissions.map(permission => {
      // Find the module ID based on permission name
      // This is a simplified mapping - you might need a proper mapping
      const moduleId = Object.values(PERMISSION_CATEGORIES)
        .flat()
        .find(p => p.id === permission)?.id === permission ? 1 : 2; // Default fallback

      return {
        systemModuleId: moduleId,
        systemRoleScopeIsActive: true,
      };
    });

    await createOrUpdateRole({
      systemRoleId: 0, // 0 for new role
      systemRoleName: roleData.roleName,
      systemRoleDescription: roleData.description,
      systemRoleIsActive: true,
      systemRoleScopes: scopes,
      actionBySystemUserId: userId,
    });

    setShowAddRole(false);
  };

  const handleEditRole = async (roleData: Omit<Role, 'id' | 'roleId' | 'userCount' | 'dateCreated'>) => {
    if (!editingRole) return;

    const userId = systemUserId || localStorage.getItem('systemUserId');
    if (!userId) {
      console.error('[RolesManagement] No systemUserId available for editing role');
      return;
    }

    console.log('[RolesManagement] Editing role with userId:', userId);

    // Convert permissions back to scopes format
    const scopes = roleData.assignedPermissions.map(permission => {
      const moduleId = Object.values(PERMISSION_CATEGORIES)
        .flat()
        .find(p => p.id === permission)?.id === permission ? 1 : 2;

      return {
        systemModuleId: moduleId,
        systemRoleScopeIsActive: true,
      };
    });

    await createOrUpdateRole({
      systemRoleId: parseInt(editingRole.id),
      systemRoleName: roleData.roleName,
      systemRoleDescription: roleData.description,
      systemRoleIsActive: true,
      systemRoleScopes: scopes,
      actionBySystemUserId: userId,
    });

    setEditingRole(null);
  };

  const handleDeleteRole = async (roleId: string) => {
    const userId = systemUserId || localStorage.getItem('systemUserId');
    if (!userId) {
      console.error('[RolesManagement] No systemUserId available for deleting role');
      return;
    }

    console.log('[RolesManagement] Deleting role with userId:', userId);

    // For delete, we set isActive to false
    await createOrUpdateRole({
      systemRoleId: parseInt(roleId),
      systemRoleName: '',
      systemRoleDescription: '',
      systemRoleIsActive: false,
      systemRoleScopes: [],
      actionBySystemUserId: userId,
    });

    setDeleteRoleId(null);
  };

  if (loading) {
    return (
      <div className="pl-64 pt-16 flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading roles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pl-64 pt-16 flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="pl-64 pt-16 space-y-8">
      <RolesHeader onAddRole={() => setShowAddRole(true)} />

      <SearchAndSummary
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalRoles={totalCount}
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
        rolesCount={frontendRoles.length}
      />

      <RoleDialog
        isOpen={editingRole !== null}
        onClose={() => setEditingRole(null)}
        onSave={handleEditRole}
        editingRole={editingRole}
        rolesCount={frontendRoles.length}
      />

      <DeleteRoleDialog
        isOpen={deleteRoleId !== null}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={() => deleteRoleId && handleDeleteRole(deleteRoleId)}
      />
    </div>
  );
}
