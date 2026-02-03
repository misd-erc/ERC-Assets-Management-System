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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, SystemRoleSimple } from '@/types/user';
import { Office, VwDivision, EmploymentType, Position } from '@/types';
import {
  editUser,
  getUsersDetails
} from '@/api/user-management/userApi';
import { getSystemRoles } from '@/api/roles/rolesApi';
import { 
  getOffices,
  getDivisions,
  getEmploymentTypes,
  getPositions
} from '@/api';

// --- Imports for Searchable Dropdown ---
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// --- Reusable Searchable Select Component ---
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: number | string; name: string | undefined }[]; // Flexible ID and Name type
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect = ({ value, onChange, options, placeholder = "Select...", disabled = false }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);

  // Helper to safely convert IDs to string for comparison
  const normalizeId = (id: number | string) => id?.toString();

  const selectedLabel = value
    ? options.find((item) => normalizeId(item.id) === value)?.name
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="[&_[cmdk-input-wrapper]]:border-0">
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            className="border-0 outline-none focus:outline-none focus:ring-0 ring-0" 
          />
          <CommandList>
            <CommandEmpty>No result found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => {
                const itemId = normalizeId(item.id);
                return (
                  <CommandItem
                    key={itemId}
                    value={item.name || ""}
                    onSelect={() => {
                      onChange(itemId);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === itemId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- Constants ---
const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '2', name: 'Inactive' },
  { id: '3', name: 'Suspended' }
];

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
  const [roles, setRoles] = useState<SystemRoleSimple[]>([]);
  
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
    if (roles.length === 0) return; 

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
      
      const systemRoles: SystemRoleSimple[] = rolesData.map(apiRole => ({
        id: apiRole.id,
        roleName: apiRole.roleName,
        description: apiRole.description,
        scope: apiRole.scope ? apiRole.scope.map(s => s.module.name) : [],
        isActive: apiRole.isActive,
        isDeleted: apiRole.isDeleted,
        createdAt: apiRole.createdAt,
        userCount: apiRole.userCount
      }));
      setRoles(systemRoles);
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

  // Helper to adapt role data for the select
  const roleOptions = roles.map(r => ({ id: r.id, name: r.roleName }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
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
              <SearchableSelect
                value={formData.officeId}
                onChange={(value) => setFormData({ ...formData, officeId: value })}
                options={offices}
                placeholder="Select office"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <SearchableSelect
                value={formData.divisionId}
                onChange={(value) => setFormData({ ...formData, divisionId: value })}
                options={divisions}
                placeholder="Select division"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <SearchableSelect
                value={formData.employmentTypeId}
                onChange={(value) => setFormData({ ...formData, employmentTypeId: value })}
                options={employmentTypes}
                placeholder="Select employment type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <SearchableSelect
                value={formData.positionId}
                onChange={(value) => setFormData({ ...formData, positionId: value })}
                options={positions}
                placeholder="Select position"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <SearchableSelect
                value={formData.roleId}
                onChange={(value) => setFormData({ ...formData, roleId: value })}
                options={roleOptions}
                placeholder="Select role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <SearchableSelect
                value={formData.statusId}
                onChange={(value) => setFormData({ ...formData, statusId: value })}
                options={STATUS_OPTIONS}
                placeholder="Select status"
              />
            </div>

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