// src/components/contract-management/vendor/VendorEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useVendor } from '@/hooks';
import { Vendor } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  vendor?: Vendor | null;
}

export const VendorEditModal = ({ open, onOpenChange, mode, vendor }: Props) => {
  const { addVendor, updateVendor } = useVendor();
  const [loading, setLoading] = useState(false);

  // Simplified state: Only Name and IsActive
  const [form, setForm] = useState<Partial<Vendor>>({
    name: '',
    address: '',
    email: '',
    contact: '',
    contactPerson: '',
    isActive: true
  });

  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setForm({
        name: vendor.name,
        address: vendor.address || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        contactPerson: vendor.contactPerson || '',
        isActive: vendor.isActive
      });
    } else {
      setForm({
        name: '',
        address: '',
        email: '',
        contact: '',
        contactPerson: '',
        isActive: true
      });
    }
  }, [mode, vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'add') {
        await addVendor(form);
      } else if (vendor) {
        await updateVendor(vendor.id, form);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Vendor' : 'Edit Vendor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Vendee</Label>
            <Input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="e.g. Quezon City, Philippines"
                  required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="e.g. myemail@example.com"
                  required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                  type="tel" // ✅ Opens numeric keypad on mobile
                  value={form.contact}
                  onChange={e => {
                    // Prevents users from typing letters/symbols
                    const val = e.target.value.replace(/[^0-9+]/g, '');
                    setForm({...form, contact: val});
                  }}
                  placeholder="e.g. 09090909090"
                  // ✅ Optional: Basic Regex for Philippine numbers (11 digits)
                  pattern="^(09|\+639)\d{9}$"
                  title="Please enter a valid 11-digit mobile number starting with 09"
                  required
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input
                  value={form.contactPerson}
                  onChange={e => setForm({...form, contactPerson: e.target.value})}
                  placeholder="e.g. Juan Dela Cruz"
                  required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={c => setForm({...form, isActive: c})}
            />
            <Label>Active Status</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};