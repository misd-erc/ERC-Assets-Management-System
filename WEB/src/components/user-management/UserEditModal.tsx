import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { User, Office, Division, EmploymentType, Position, SystemRole } from '../../types/user';
import {
  getOffices,
  getDivisions,
  getEmploymentTypes,
  getPositions,
  getSystemRoles,
  editUser
} from '../../api/userApi';



interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onSaveSuccess: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  open,
  onClose,
  selectedUser,
  onSaveSuccess,
}) => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    officeId: '',
    divisionId: '',
    employmentTypeId: '0',
    positionId: '0',
    roleId: '',
    isActive: true,
  });

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  // Prefill form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      // Find roleId by matching role name
      const role = roles.find(r => r.roleName === selectedUser.role);
      const statusId = selectedUser.status === 'Active' ? '0' : selectedUser.status === 'Inactive' ? '1' : '2';
      setFormData({
        officeId: selectedUser.officeId || '',
        divisionId: selectedUser.divisionId || '',
        employmentTypeId: selectedUser.employmentTypeId || '0',
        positionId: selectedUser.positionId || '0',
        roleId: role ? role.id.toString() : '',
        isActive: selectedUser.status === 'Active',
      });
    }
  }, [selectedUser, roles]);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ActionBySystemUserIdEncrypted') || '';

      const [officesData, divisionsData, employmentTypesData, positionsData, rolesData] = await Promise.all([
        getOffices(token),
        getDivisions(token),
        getEmploymentTypes(token),
        getPositions(token),
        getSystemRoles(token),
      ]);

      setOffices(officesData);
      setDivisions(divisionsData);
      setEmploymentTypes(employmentTypesData);
      setPositions(positionsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('ActionBySystemUserIdEncrypted') || '';

      const statusId = formData.isActive ? '0' : '1'; // 0 for Active, 1 for Inactive

      const payload = {
        systemUserIdEncrypted: token,
        systemRoleIdEncrypted: formData.roleId || undefined,
        officeIdEncrypted: formData.officeId || undefined,
        divisionIdEncrypted: formData.divisionId || undefined,
        employmentTypeIdEncrypted: formData.employmentTypeId,
        positionIdEncrypted: formData.positionId,
        statusIdEncrypted: statusId,
        isActiveEncrypted: formData.isActive ? 'true' : 'false',
        actionBySystemUserIdEncrypted: token,
      };

      await editUser(payload);
      toast.success('User updated successfully');
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved to the system.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">Loading form data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="office">Office</Label>
              <Select
                value={formData.officeId}
                onValueChange={(value) => setFormData({ ...formData, officeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id.toString()}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <Select
                value={formData.divisionId}
                onValueChange={(value) => setFormData({ ...formData, divisionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id.toString()}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentTypeId}
                onValueChange={(value) => setFormData({ ...formData, employmentTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) => setFormData({ ...formData, positionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id.toString()}>
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 md:col-span-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Status</Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
