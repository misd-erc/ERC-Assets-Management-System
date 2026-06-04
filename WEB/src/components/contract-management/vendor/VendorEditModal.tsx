// src/components/contract-management/vendor/VendorEditModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const [form, setForm] = useState<Partial<Vendor>>({
    name: '',
    address: '',
    email: '',
    contact: '',
    contactPerson: '',
    isActive: true,
    vendorType: 'Service',
    contractStart: '',
    contractEnd: '',
    procurementTitle: '',
    terms: '',
    deliveryDate: '',
    deliveryDueDate: ''
  });

  useEffect(() => {
    if (mode === 'edit' && vendor) {
      setForm({
        name: vendor.name,
        address: vendor.address || '',
        email: vendor.email || '',
        contact: vendor.contact || '',
        contactPerson: vendor.contactPerson || '',
        isActive: vendor.isActive,
        vendorType: vendor.vendorType || (vendor.contractStart || vendor.contractEnd ? 'Service' : 'Goods'),
        contractStart: vendor.contractStart ? vendor.contractStart.split('T')[0] : '',
        contractEnd: vendor.contractEnd ? vendor.contractEnd.split('T')[0] : '',
        procurementTitle: vendor.procurementTitle || '',
        terms: vendor.terms || '',
        deliveryDate: vendor.deliveryDate ? vendor.deliveryDate.split('T')[0] : '',
        deliveryDueDate: vendor.deliveryDueDate ? vendor.deliveryDueDate.split('T')[0] : ''
      });
    } else {
      setForm({
        name: '',
        address: '',
        email: '',
        contact: '',
        contactPerson: '',
        isActive: true,
        vendorType: 'Service',
        contractStart: '',
        contractEnd: '',
        procurementTitle: '',
        terms: '',
        deliveryDate: '',
        deliveryDueDate: ''
      });
    }
  }, [mode, vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        contractStart: form.vendorType === 'Service' ? form.contractStart || null : null,
        contractEnd: form.vendorType === 'Service' ? form.contractEnd || null : null,
        deliveryDate: form.vendorType === 'Goods' ? form.deliveryDate || null : null,
        deliveryDueDate: form.vendorType === 'Goods' ? form.deliveryDueDate || null : null,
      };

      if (mode === 'add') {
        await addVendor(payload);
      } else if (vendor) {
        await updateVendor(vendor.id, payload);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                type="tel"
                value={form.contact}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9+]/g, '');
                  setForm({...form, contact: val});
                }}
                placeholder="e.g. 09090909090"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor Type</Label>
              <Select
                value={form.vendorType || 'Service'}
                onValueChange={val => setForm({...form, vendorType: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Goods">Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Procurement Title</Label>
              <Input
                value={form.procurementTitle || ''}
                onChange={e => setForm({...form, procurementTitle: e.target.value})}
                placeholder="e.g. Supply & Delivery of Office Equip..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Terms</Label>
            <Input
              value={form.terms || ''}
              onChange={e => setForm({...form, terms: e.target.value})}
              placeholder="e.g. Net 30, COD"
            />
          </div>

          {form.vendorType === 'Service' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Start</Label>
                <Input
                  type="date"
                  value={form.contractStart || ''}
                  onChange={e => setForm({...form, contractStart: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Contract End</Label>
                <Input
                  type="date"
                  value={form.contractEnd || ''}
                  onChange={e => setForm({...form, contractEnd: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={form.deliveryDate || ''}
                  onChange={e => setForm({...form, deliveryDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Due Date</Label>
                <Input
                  type="date"
                  value={form.deliveryDueDate || ''}
                  onChange={e => setForm({...form, deliveryDueDate: e.target.value})}
                />
              </div>
            </div>
          )}

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