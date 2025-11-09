import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { Role } from '../../types/roles';
import { PERMISSION_CATEGORIES } from '../../constants/permissions';

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id' | 'roleId' | 'userCount' | 'dateCreated'>) => void;
  editingRole?: Role | null;
  rolesCount: number;
}

export function RoleDialog({ isOpen, onClose, onSave, editingRole, rolesCount }: RoleDialogProps) {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (editingRole) {
      setRoleName(editingRole.roleName);
      setDescription(editingRole.description);
      setPermissions(editingRole.assignedPermissions);
    } else {
      setRoleName('');
      setDescription('');
      setPermissions([]);
    }
  }, [editingRole, isOpen]);

  const handleSave = () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    onSave({
      roleName,
      description,
      assignedPermissions: permissions,
    });

    onClose();
  };

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    const allPermissions = Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id);
    setPermissions(prev => prev.length === allPermissions.length ? [] : allPermissions);
  };

  const getAllPermissions = () => {
    return Object.entries(PERMISSION_CATEGORIES).flatMap(([category, permissions]) =>
      permissions.map(permission => ({ ...permission, category }))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
          <DialogDescription>
            {editingRole ? 'Modify role information and permissions' : 'Create a new role and assign permissions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
          </div>

          {/* Permission Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Permissions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {permissions.length === getAllPermissions().length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPermissions]) => (
              <Card key={category} className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${editingRole ? 'edit' : 'new'}-${permission.id}`}
                          checked={permissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex items-center space-x-2">
                          <permission.icon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <Label htmlFor={`${editingRole ? 'edit' : 'new'}-${permission.id}`} className="text-sm font-medium">
                              {permission.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
