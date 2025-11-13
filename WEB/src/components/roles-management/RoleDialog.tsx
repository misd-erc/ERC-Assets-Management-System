import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Role } from '@/types/roles';
import { PERMISSION_CATEGORIES } from '@/constants/permissions';

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

  const handleCategoryToggle = (categoryPermissions: any[]) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => permissions.includes(id));

    if (allSelected) {
      // Deselect all in category
      setPermissions(prev => prev.filter(id => !categoryPermissionIds.includes(id)));
    } else {
      // Select all in category
      setPermissions(prev => [...new Set([...prev, ...categoryPermissionIds])]);
    }
  };

  const getAllPermissions = () => {
    return Object.entries(PERMISSION_CATEGORIES).flatMap(([category, permissions]) =>
      permissions.map(permission => ({ ...permission, category }))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            {editingRole ? 'Edit Role' : 'Add New Role'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {editingRole ? 'Modify role information and permissions' : 'Create a new role and assign permissions'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Role Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName" className="text-sm font-medium">Role Name</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter role description"
                  className="h-10"
                />
              </div>
            </div>

            {/* Permission Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Permissions</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm hover:bg-muted"
                >
                  {permissions.length === getAllPermissions().length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPermissions], categoryIndex) => {
                  const categoryPermissionIds = categoryPermissions.map(p => p.id);
                  const allSelected = categoryPermissionIds.every(id => permissions.includes(id));
                  const someSelected = categoryPermissionIds.some(id => permissions.includes(id));

                  return (
                    <Card key={category} className="rounded-xl shadow-sm border bg-card">
                      <CardHeader className="pb-4">
                        <CardTitle
                          className="text-base font-semibold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center justify-between"
                          onClick={() => handleCategoryToggle(categoryPermissions)}
                        >
                          <span>{category}</span>
                          <div className="flex items-center">
                            <Checkbox
                              checked={allSelected}
                              className="ml-2 pointer-events-none"
                            />
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryPermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                              onClick={() => handlePermissionToggle(permission.id)}
                            >
                              <Checkbox
                                id={`${editingRole ? 'edit' : 'new'}-${permission.id}`}
                                checked={permissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="mt-0.5"
                              />
                              <div className="flex items-start space-x-3 flex-1 min-w-0">
                                <permission.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <Label
                                    htmlFor={`${editingRole ? 'edit' : 'new'}-${permission.id}`}
                                    className="text-sm font-medium text-foreground cursor-pointer group-hover:text-primary transition-colors"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      {categoryIndex < Object.keys(PERMISSION_CATEGORIES).length - 1 && (
                        <div className="px-6 pb-4">
                          <div className="h-px bg-border" />
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSave} className="px-6 bg-primary hover:bg-primary/90">
            {editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




