import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, SystemRole } from '@/types/user';
import { Office, Division, EmploymentType, Position, VwDivision } from '@/types';
import { useAuthStore } from '@/store/auth';
import {
  editUser,
  getUsersDetails
} from '@/api/user-management/userApi';
import { getSystemRoles } from '@/api/roles/rolesApi';
import { getOffices,
  getDivisions,
  getEmploymentTypes,
  getPositions
 } from '@/api';
import { UserDetails } from '@/types/user';



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
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [formData, setFormData] = useState({
    officeId: '',
    divisionId: '',
    employmentTypeId: '',
    positionId: '',
    statusId: '',
    roleId: '',
    isActive: true,
  });

  const prefillForm = async (user: User) => {
    if (roles.length === 0) return; // Wait for roles to load

    setLoadingUserDetails(true);

    try {
      const details = await getUsersDetails(user.id.toString());
      const role = roles.find((r) => r.roleName === user.systemRole?.[0]?.roleName);

      setFormData({
        officeId: (details as any).officeId?.toString() || user.office?.id?.toString() || '',
        divisionId: (details as any).divisionId?.toString() || user.division?.id?.toString() || '',
        employmentTypeId: (details as any).employmentType?.id?.toString() || user.employmentType?.id?.toString() || '',
        positionId: (details as any).position?.id?.toString() || user.position?.id?.toString() || '',
        statusId: (details as any).statusId?.toString() || user.systemUserStatus?.id?.toString() || '',
        roleId: role ? role.id.toString() : '',
        isActive: details.isActive ?? user.isActive,
      });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to load user details');
      // Fallback to selectedUser data
      const role = roles.find(r => r.roleName === user.systemRole?.[0]?.roleName);
      setFormData({
        officeId: user.office?.id?.toString() || '',
        divisionId: user.division?.id?.toString() || '',
        employmentTypeId: user.employmentType?.id?.toString() || '',
        positionId: user.position?.id?.toString() || '',
        statusId: user.systemUserStatus?.id?.toString() || '',
        roleId: role ? role.id.toString() : '',
        isActive: user.isActive,
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedUser) {
      prefillForm(selectedUser);
    }
  }, [open, selectedUser, roles]);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);

      const [officesData, divisionsData, employmentTypesData, positionsData, rolesData] = await Promise.all([
        getOffices(),
        getDivisions(),
        getEmploymentTypes(),
        getPositions(),
        getSystemRoles(),
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
      const token = localStorage.getItem('systemUserId') || '';

      const statusId = formData.isActive ? '0' : '1'; // 0 for Active, 1 for Inactive

      const payload = {
        systemUserId: selectedUser.id,
        systemRoleId: formData.roleId ? parseInt(formData.roleId, 10) : undefined,
        officeId: formData.officeId ? parseInt(formData.officeId, 10) : undefined,
        divisionId: formData.divisionId ? parseInt(formData.divisionId, 10) : undefined,
        employmentTypeId: formData.employmentTypeId ? parseInt(formData.employmentTypeId, 10) : undefined,
        positionId: formData.positionId ? parseInt(formData.positionId, 10) : undefined,
        statusId: formData.statusId ? parseInt(formData.statusId, 10) : undefined,
        isActive: formData.isActive,
        actionBySystemUserId: parseInt(token, 10),
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

        {loading || loadingUserDetails ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">{loading ? 'Loading form data...' : 'Loading user details...'}</p>
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
                value={formData.employmentTypeId || undefined}
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
                value={formData.positionId || undefined}
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.statusId || undefined}
                onValueChange={(value) => setFormData({ ...formData, statusId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="2">Inactive</SelectItem>
                  <SelectItem value="3">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* <div className="flex items-center space-x-2 md:col-span-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">{formData.isActive ? 'Active' : 'Inactive'}</Label>
            </div> */}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || loadingUserDetails}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};






