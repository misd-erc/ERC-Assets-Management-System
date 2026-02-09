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
    isActive: true
  });

  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setForm({
        name: vendor.name,
        isActive: vendor.isActive
      });
    } else {
      setForm({
        name: '',
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
            <Label>Vendor Name</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="e.g. Acme Corp"
              required 
            />
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