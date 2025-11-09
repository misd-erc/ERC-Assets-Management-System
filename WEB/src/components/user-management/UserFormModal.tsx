import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { createUser, updateUser, editUser } from '../../api/user-management/userApi';
import { User } from '../../types/user';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/auth';


interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

export const UserFormModal = ({
  isOpen,
  onClose,
  user,
  onSuccess
}: UserFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: '',
    systemRoleName: '',
    position: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Suspended',
    department: '',
    officeId: '',
    divisionId: '',
    employmentTypeId: '',
    positionId: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: `${user.firstName} ${user.lastName}` || '',
        email: user.email || '',
        username: user.employeeId || '',
        role: user.systemRole[0]?.roleName || '',
        systemRoleName: user.systemRole[0]?.roleName || '',
        position: '',
        status: (user.systemUserStatus.name as 'Active' | 'Inactive' | 'Suspended') || 'Active',
        department: user.division?.name || '',
        officeId: user.office?.id.toString() || '',
        divisionId: user.division?.id.toString() || '',
        employmentTypeId: '',
        positionId: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        role: '',
        systemRoleName: '',
        position: '',
        status: 'Active',
        department: '',
        officeId: '',
        divisionId: '',
        employmentTypeId: '',
        positionId: ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const token = localStorage.getItem('ActionBySystemUserId') || '';
        const statusId = formData.status === 'Active' ? '0' : formData.status === 'Inactive' ? '1' : '2';
        await editUser({
          systemUserId: parseInt(user.id.toString(), 10),
          systemRoleId: formData.role ? parseInt(formData.role, 10) : undefined,
          officeId: formData.officeId ? parseInt(formData.officeId, 10) : undefined,
          divisionId: formData.divisionId ? parseInt(formData.divisionId, 10) : undefined,
          employmentTypeId: parseInt(formData.employmentTypeId || '0', 10),
          positionId: parseInt(formData.positionId || '0', 10),
          isActive: formData.status === 'Active',
          actionBySystemUserId: parseInt(token, 10)
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        await createUser({
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          employeeId: formData.username,
          isActive: formData.status === 'Active',
          systemRole: formData.role ? [{ id: parseInt(formData.role, 10), roleName: formData.role, description: '', isActive: true, isDeleted: false, createdAt: '' }] : [],
          systemUserStatus: { id: 1, name: formData.status, isActive: true, isDeleted: false, createdAt: '' },
          office: formData.officeId ? { id: parseInt(formData.officeId, 10), name: '', acronym: '', isActive: true } : null,
          division: formData.divisionId ? { id: parseInt(formData.divisionId, 10), name: '', officeId: parseInt(formData.officeId || '0', 10), acronym: '' } : null,
          profilePictureStorageFile: null,
          createdAt: '',
          lastLoginAt: ''
        });
        toast.success('User created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user information and settings.' : 'Create a new user account with appropriate role and permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Property Custodian">Property Custodian</SelectItem>
                  <SelectItem value="Approver">Approver</SelectItem>
                  <SelectItem value="End User">End User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="officeId">Office</Label>
              <Select value={formData.officeId} onValueChange={(value) => handleInputChange('officeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Main Office</SelectItem>
                  <SelectItem value="2">Branch Office</SelectItem>
                  <SelectItem value="3">Remote Office</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="divisionId">Division</Label>
              <Select value={formData.divisionId} onValueChange={(value) => handleInputChange('divisionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">IT Division</SelectItem>
                  <SelectItem value="2">Finance Division</SelectItem>
                  <SelectItem value="3">HR Division</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employmentTypeId">Employment Type</Label>
              <Select value={formData.employmentTypeId} onValueChange={(value) => handleInputChange('employmentTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Full-time</SelectItem>
                  <SelectItem value="2">Part-time</SelectItem>
                  <SelectItem value="3">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="positionId">Position</Label>
              <Select value={formData.positionId} onValueChange={(value) => handleInputChange('positionId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Manager</SelectItem>
                  <SelectItem value="2">Developer</SelectItem>
                  <SelectItem value="3">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive' | 'Suspended') => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Enter department"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
