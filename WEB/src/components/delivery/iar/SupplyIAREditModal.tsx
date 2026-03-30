import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendor, useOffice, useDivision } from '@/hooks';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import {Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {Check, ChevronsUpDown} from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
        iarInvoiceNumberDate: record.iarInvoiceNumberDate?.split('T')[0] || '',
        actualDeliveryDate: record.actualDeliveryDate?.split('T')[0] || ''
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
        actualDeliveryDate: '',
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

            <div className="space-y-2 min-w-0 flex flex-col">
              <Label className="text-slate-700 font-medium">Office</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors"
                  >
                    <span className="truncate text-slate-700">
                      {formData.officeId
                          ? vwOffices.find((o: any) => o.id === formData.officeId)?.name
                          : "Select Office"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                  <Command className="bg-white">

                    {/* --- ENHANCED SEARCH BOX --- */}
                    <div className="p-2 bg-slate-50 border-b border-slate-100">
                      <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                        <CommandInput
                            placeholder="Search office..."
                            className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                        />
                      </div>
                    </div>
                    {/* --------------------------- */}

                    {/* ✅ CommandList with Scroll Fixes ✅ */}
                    <CommandList
                        className="max-h-60 overflow-y-auto overscroll-contain"
                        onWheelCapture={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                        No office found.
                      </CommandEmpty>

                      <CommandGroup className="p-1.5">
                        {/* Replaces the old value="0" select item */}
                        <CommandItem
                            onSelect={() => setFormData({...formData, officeId: 0, divisionId: 0})}
                            className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50"
                        >
                          <span className="truncate flex-1">Clear Selection</span>
                        </CommandItem>

                        {vwOffices.map((o: any) => (
                            <CommandItem
                                key={o.id}
                                value={o.name}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    officeId: o.id,
                                    divisionId: 0
                                  });
                                }}
                                className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                            >
                              <span className="truncate flex-1">{o.name}</span>
                              <Check
                                  className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${
                                      formData.officeId === o.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
                                  }`}
                              />
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 min-w-0 flex flex-col">
              <Label className="text-slate-700 font-medium">Division</Label>
              <Popover>
                {/* ✅ Preserved your disabled logic here */}
                <PopoverTrigger asChild disabled={!formData.officeId}>
                  <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
        <span className="truncate text-slate-700">
          {formData.divisionId
              ? filteredDivisions.find((d: any) => d.id === formData.divisionId)?.name
              : "Select Division"}
        </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                  <Command className="bg-white">

                    {/* --- ENHANCED SEARCH BOX --- */}
                    <div className="p-2 bg-slate-50 border-b border-slate-100">
                      <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                        <CommandInput
                            placeholder="Search division..."
                            className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                        />
                      </div>
                    </div>
                    {/* --------------------------- */}

                    {/* ✅ CommandList with Scroll Fixes ✅ */}
                    <CommandList
                        className="max-h-60 overflow-y-auto overscroll-contain"
                        onWheelCapture={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                        No division found.
                      </CommandEmpty>

                      <CommandGroup className="p-1.5">
                        {/* Replaces the old value="0" select item */}
                        <CommandItem
                            onSelect={() => setFormData({...formData, divisionId: 0})}
                            className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50"
                        >
                          <span className="truncate flex-1">Clear Selection</span>
                        </CommandItem>

                        {/* Mapped filteredDivisions */}
                        {filteredDivisions.map((d: any) => (
                            <CommandItem
                                key={d.id}
                                value={d.name}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    divisionId: d.id
                                  });
                                }}
                                className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                            >
                              <span className="truncate flex-1">{d.name}</span>
                              <Check
                                  className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${
                                      formData.divisionId === d.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
                                  }`}
                              />
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold">Vendor & Purchase Details</h3>
            </div>

            <div className="space-y-2 col-span-2 min-w-0 flex flex-col">
              <Label className="text-slate-700 font-medium">Vendor</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors"
                  >
        <span className="truncate text-slate-700">
          {formData.vendorId
              ? vendors.find((v: any) => v.id === formData.vendorId)?.name
              : "Select Vendor"}
        </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                  <Command className="bg-white">

                    {/* --- ENHANCED SEARCH BOX --- */}
                    <div className="p-2 bg-slate-50 border-b border-slate-100">
                      <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                        <CommandInput
                            placeholder="Search vendor..."
                            className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                        />
                      </div>
                    </div>
                    {/* --------------------------- */}

                    {/* ✅ CommandList with Scroll Fixes ✅ */}
                    <CommandList
                        className="max-h-60 overflow-y-auto overscroll-contain"
                        onWheelCapture={(e) => e.stopPropagation()}
                    >
                      <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                        No vendor found.
                      </CommandEmpty>

                      <CommandGroup className="p-1.5">
                        {/* Clear Selection Option */}
                        <CommandItem
                            onSelect={() => setFormData({...formData, vendorId: 0})}
                            className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50"
                        >
                          <span className="truncate flex-1">Clear Selection</span>
                        </CommandItem>

                        {/* Mapped Vendors */}
                        {vendors.map((v: any) => (
                            <CommandItem
                                key={v.id}
                                value={v.name}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    vendorId: v.id
                                  });
                                }}
                                className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                            >
                              <span className="truncate flex-1">{v.name}</span>
                              <Check
                                  className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${
                                      formData.vendorId === v.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"
                                  }`}
                              />
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2"><Label>PO Number</Label><Input value={formData.poNumber || ''} onChange={e => setFormData({...formData, poNumber: e.target.value})} required /></div>
            <div className="space-y-2"><Label>PO Date</Label><Input type="date" value={formData.poDate || ''} onChange={e => setFormData({...formData, poDate: e.target.value})} /></div>
            
            <div className="space-y-2"><Label>Actual Delivery Date</Label><Input type="date" value={formData.actualDeliveryDate || ''} onChange={e => setFormData({...formData, actualDeliveryDate: e.target.value})} /></div>
            
            <div className="space-y-2"><Label>Invoice Number</Label><Input value={formData.iarInvoiceNumber || ''} onChange={e => setFormData({...formData, iarInvoiceNumber: e.target.value})} /></div>
            <div className="space-y-2"><Label>Invoice Date</Label><Input type="date" value={formData.iarInvoiceNumberDate || ''} onChange={e => setFormData({...formData, iarInvoiceNumberDate: e.target.value})} /></div>
          </div>
          <DialogFooter><Button type="submit">Save IAR Record</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};