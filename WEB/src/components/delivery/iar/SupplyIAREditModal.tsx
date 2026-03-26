import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendor, useOffice, useDivision } from '@/hooks';
import { VwDeliveryRecord } from '@/types/delivery/delivery';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  record?: any;
  onSubmit: (data: any) => void;
  availableDeliveryRecords: VwDeliveryRecord[];
}

export const SupplyIAREditModal = ({ open, onOpenChange, mode, record, onSubmit, availableDeliveryRecords }: Props) => {
  const { vendors, fetchVendors } = useVendor();
  const { vwOffices, fetchOffices } = useOffice();
  const { vwDivisions, fetchDivisions } = useDivision();
  
  const [formData, setFormData] = useState<any>({ entityName: 'Energy Regulatory Commission', isActive: true });

  useEffect(() => { if (open) { fetchVendors(); fetchOffices(); fetchDivisions(); } }, [open]);

  useEffect(() => {
    if (mode === 'edit' && record) {
      setFormData({
        ...record,
        vendorId: record.vendor?.id || 0,
        officeId: record.office?.id || 0,
        divisionId: record.division?.id || 0,
        recordId: record.recordId || 0,
        iarNumberDate: record.iarNumberDate?.split('T')[0] || '',
        poDate: record.poDate?.split('T')[0] || '',
        iarInvoiceNumberDate: record.iarInvoiceNumberDate?.split('T')[0] || ''
      });
    } else {
      setFormData({ 
        id: 0, 
        centerCode: '', 
        entityName: 'Energy Regulatory Commission', 
        fundCluster: '',
        vendorId: 0, 
        poNumber: '',
        officeId: 0, 
        divisionId: 0,
        recordId: 0,
        iarNumber: '',
        iarNumberDate: '',
        iarInvoiceNumber: '',
        iarInvoiceNumberDate: '',
        poDate: '',
        isActive: true 
      });
    }
  }, [mode, record, open]);

  const filteredDivisions = vwDivisions.filter((d: any) => d.office?.id === formData.officeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'add' ? 'New IAR' : 'Edit IAR'}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Linked Delivery Record */}
            <div className="space-y-2 col-span-2">
              <Label>Linked Delivery Record (DR)</Label>
              <Select 
                value={formData.recordId?.toString()} 
                onValueChange={v => setFormData({...formData, recordId: Number(v)})}
              >
                <SelectTrigger>
                  <div className="truncate text-left">
                    <SelectValue placeholder="Select or search DR Number" />
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[300px]">
                  <SelectItem value="0">Select Delivery Record</SelectItem>
                  {availableDeliveryRecords.length > 0 ? (
                    availableDeliveryRecords.map((dr: VwDeliveryRecord) => (
                      <SelectItem key={dr.id} value={dr.id.toString()}>
                        <span className="truncate">
                          {dr.drNumber} • {dr.deliveryDate?.split('T')[0]} • {dr.items?.length || 0} items
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No pending delivery records available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Only shows unlinked, unreceived delivery records.</p>
            </div>
            
             <div className="space-y-2"><Label>IAR Number</Label><Input value={formData.iarNumber || ''} onChange={e => setFormData({...formData, iarNumber: e.target.value})} required /></div>
             <div className="space-y-2"><Label>IAR Date</Label><Input type="date" value={formData.iarNumberDate || ''} onChange={e => setFormData({...formData, iarNumberDate: e.target.value})} required /></div>
             
             <div className="space-y-2"><Label>Entity Name</Label><Input value={formData.entityName || ''} onChange={e => setFormData({...formData, entityName: e.target.value})} required /></div>
             <div className="space-y-2"><Label>Fund Cluster</Label><Input value={formData.fundCluster || ''} onChange={e => setFormData({...formData, fundCluster: e.target.value})} /></div>
             
             <div className="space-y-2 col-span-2"><Label>Responsibility Center Code</Label><Input value={formData.centerCode || ''} onChange={e => setFormData({...formData, centerCode: e.target.value})} /></div>

             <div className="space-y-2">
              <Label>Office</Label>
              <Select value={formData.officeId?.toString()} onValueChange={v => setFormData({...formData, officeId: Number(v), divisionId: 0})}>
                <SelectTrigger>
                  <div className="truncate text-left">
                    <SelectValue placeholder="Select Office" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Office</SelectItem>
                  {vwOffices.map((o: any) => <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={formData.divisionId?.toString()} onValueChange={v => setFormData({...formData, divisionId: Number(v)})} disabled={!formData.officeId}>
                <SelectTrigger>
                  <div className="truncate text-left">
                    <SelectValue placeholder="Select Division" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Division</SelectItem>
                  {filteredDivisions.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold">Vendor & Purchase Details</h3>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Vendor</Label>
              <Select value={formData.vendorId?.toString()} onValueChange={v => setFormData({...formData, vendorId: Number(v)})}>
                <SelectTrigger>
                  <div className="truncate text-left">
                    <SelectValue placeholder="Select Vendor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Select Vendor</SelectItem>
                  {vendors.map((v: any) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2"><Label>PO Number</Label><Input value={formData.poNumber || ''} onChange={e => setFormData({...formData, poNumber: e.target.value})} required /></div>
            <div className="space-y-2"><Label>PO Date</Label><Input type="date" value={formData.poDate || ''} onChange={e => setFormData({...formData, poDate: e.target.value})} /></div>
            
            <div className="space-y-2"><Label>Invoice Number</Label><Input value={formData.iarInvoiceNumber || ''} onChange={e => setFormData({...formData, iarInvoiceNumber: e.target.value})} /></div>
            <div className="space-y-2"><Label>Invoice Date</Label><Input type="date" value={formData.iarInvoiceNumberDate || ''} onChange={e => setFormData({...formData, iarInvoiceNumberDate: e.target.value})} /></div>
          </div>
          <DialogFooter><Button type="submit">Save IAR Record</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};