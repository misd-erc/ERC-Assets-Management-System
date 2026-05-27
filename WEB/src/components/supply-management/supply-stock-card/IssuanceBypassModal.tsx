// src/components/supply-management/supply-stock-card/IssuanceBypassModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronsUpDown, Loader2, PlusCircle, FileSpreadsheet } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

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

import { useSupplyItem, useSupplyUnit, useSupplyStorageLocation, useVendor, useOffice, useDivision } from '@/hooks';
import { useRISStore } from '@/store/supply/risStore';
import { getCategories } from '@/api/asset/inventoryApi';
import { getUsers } from '@/api';
import { getAuthParams } from '@/utils/auth';
import { SupplyItem, User } from '@/types';
import { EditSupplyRIS, EditSupplyRISItem } from '@/types/supply/ris';

interface SearchableSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: { id: number; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect = ({ value, onChange, options, placeholder = "Select...", disabled = false }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-white border-slate-200 shadow-sm text-slate-700",
            !value && "text-slate-400"
          )}
        >
          {value ? options.find((item) => item.id === value)?.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border border-slate-200 rounded-lg shadow-lg overflow-hidden" align="start">
        <Command className="bg-white">
          <CommandInput className="border-0 outline-none focus:outline-none focus:ring-0 ring-0 p-2" placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No result found.</CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <Check className={cn("mr-2 h-4 w-4 text-blue-600", value === item.id ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
  unitId?: number;
  onSuccess: () => void;
}

export const IssuanceBypassModal = ({ open, onOpenChange, stockNumber, description, unitId, onSuccess }: Props) => {
  const { addSupplyItem } = useSupplyItem();
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocation();
  const { vendors, fetchVendors } = useVendor();
  const { vwOffices, fetchOffices } = useOffice();
  const { vwDivisions, fetchDivisions } = useDivision();
  const { saveRIS } = useRISStore();

  const [activeTab, setActiveTab] = useState<'add-item' | 'ris'>('add-item');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Tab 1: Supply Item Form State
  const [itemForm, setItemForm] = useState<Partial<SupplyItem>>({
    code: '',
    description: '',
    categoryId: 0,
    measurementUnitId: 0,
    quantity: 0,
    unitCost: 0,
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0,
    isActive: true,
    createdAt: new Date().toISOString().slice(0, 10),
  });

  // Tab 2: RIS Form State
  const [risForm, setRisForm] = useState({
    entityName: 'Energy Regulatory Commission',
    fundCluster: '01',
    officeId: 0,
    divisionId: 0,
    responsibilityCenterCode: '',
    risNumber: '',
    risPurpose: '',
    risRequestedDate: new Date().toISOString().slice(0, 10),
    risRequestedBySystemUserId: 0,
    risApprovedBySystemUserId: 0,
    risApprovedDate: new Date().toISOString().slice(0, 10),
    risIssuedBySystemUserId: 0,
    risIssuedDate: new Date().toISOString().slice(0, 10),
    risReceivedBySystemUserId: 0,
    risReceivedDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString().slice(0, 10),
  });

  const [risItemForm, setRisItemForm] = useState({
    requisitionQuantity: 1,
    issueQuantity: 1,
    itemRemarks: '',
  });

  // Load Reference Data
  useEffect(() => {
    if (open) {
      fetchSupplyUnits();
      fetchSupplyStorageLocations();
      fetchVendors();
      fetchOffices();
      fetchDivisions();

      getCategories()
        .then(setCategories)
        .catch((err) => console.error("Failed to load categories", err));

      getUsers({ page: 1, pageSize: 10000 })
        .then((res) => setUsers(res.data.items || []))
        .catch((err) => console.error("Failed to load users", err));

      // Reset forms
      setItemForm({
        code: stockNumber,
        description: description,
        categoryId: 0,
        measurementUnitId: unitId || 0,
        quantity: 0,
        unitCost: 0,
        reorderPoint: 0,
        storageLocationId: 0,
        vendorId: 0,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      });

      const { systemUserId } = getAuthParams();
      setRisForm({
        entityName: 'Energy Regulatory Commission',
        fundCluster: '01',
        officeId: 0,
        divisionId: 0,
        responsibilityCenterCode: '',
        risNumber: '',
        risPurpose: '',
        risRequestedDate: new Date().toISOString().slice(0, 10),
        risRequestedBySystemUserId: systemUserId || 0,
        risApprovedBySystemUserId: systemUserId || 0,
        risApprovedDate: new Date().toISOString().slice(0, 10),
        risIssuedBySystemUserId: systemUserId || 0,
        risIssuedDate: new Date().toISOString().slice(0, 10),
        risReceivedBySystemUserId: 0,
        risReceivedDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString().slice(0, 10),
      });

      setRisItemForm({
        requisitionQuantity: 1,
        issueQuantity: 1,
        itemRemarks: '',
      });

      setActiveTab('add-item');
    }
  }, [open, stockNumber, description, unitId]);

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitAddItem(true);
  };

  const handleAddItemSaveAndAddAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    await submitAddItem(false);
  };

  const submitAddItem = async (closeAfterSave: boolean) => {
    if (!itemForm.categoryId) {
      toast.error('Category is required');
      return;
    }
    if (!itemForm.measurementUnitId) {
      toast.error('Measurement Unit is required');
      return;
    }
    if (!itemForm.storageLocationId) {
      toast.error('Storage Location is required');
      return;
    }
    if (!itemForm.vendorId) {
      toast.error('Vendor is required');
      return;
    }

    setLoading(true);
    try {
      await addSupplyItem(itemForm);
      toast.success('Supply item stock added successfully');
      onSuccess();
      if (closeAfterSave) {
        onOpenChange(false);
      } else {
        setItemForm(prev => ({
          ...prev,
          quantity: 0,
          unitCost: 0,
          reorderPoint: 0,
        }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add supply item stock');
    } finally {
      setLoading(false);
    }
  };

  const handleRisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRis(true);
  };

  const handleRisSaveAndAddAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    await submitRis(false);
  };

  const submitRis = async (closeAfterSave: boolean) => {
    if (!risForm.risNumber?.trim()) {
      toast.error('RIS Number is required');
      return;
    }
    if (!risForm.entityName?.trim()) {
      toast.error('Entity Name is required');
      return;
    }
    if (!risForm.fundCluster?.trim()) {
      toast.error('Fund Cluster is required');
      return;
    }
    if (!risForm.officeId || risForm.officeId === 0) {
      toast.error('Office is required');
      return;
    }
    if (!risForm.divisionId || risForm.divisionId === 0) {
      toast.error('Division is required');
      return;
    }
    if (!risForm.responsibilityCenterCode?.trim()) {
      toast.error('Responsibility Center Code is required');
      return;
    }
    if (!risForm.risPurpose?.trim()) {
      toast.error('Purpose is required');
      return;
    }
    if (!risForm.risRequestedBySystemUserId || risForm.risRequestedBySystemUserId === 0) {
      toast.error('Requested By system user is required');
      return;
    }
    if (!risForm.risApprovedBySystemUserId || risForm.risApprovedBySystemUserId === 0) {
      toast.error('Approved By system user is required');
      return;
    }
    if (!risForm.risIssuedBySystemUserId || risForm.risIssuedBySystemUserId === 0) {
      toast.error('Issued By system user is required');
      return;
    }
    if (risItemForm.requisitionQuantity <= 0) {
      toast.error('Requisitioned Quantity must be greater than 0');
      return;
    }
    if (risItemForm.issueQuantity < 0) {
      toast.error('Issued Quantity cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const { systemUserId } = getAuthParams();

      const headerData: EditSupplyRIS = {
        id: 0,
        entityName: risForm.entityName,
        fundCluster: risForm.fundCluster,
        officeId: risForm.officeId,
        divisionId: risForm.divisionId || 0,
        responsibilityCenterCode: risForm.responsibilityCenterCode,
        risNumber: risForm.risNumber,
        risPurpose: risForm.risPurpose,
        risRequestedBySystemUserId: risForm.risRequestedBySystemUserId,
        risRequestedDate: risForm.risRequestedDate,

        // AUTO APPROVAL logic
        isApproved: true,
        risApprovedBySystemUserId: risForm.risApprovedBySystemUserId || systemUserId,
        risApprovedDate: risForm.risApprovedDate ? new Date(risForm.risApprovedDate).toISOString() : new Date().toISOString(),
        risIssuedBySystemUserId: risForm.risIssuedBySystemUserId || systemUserId,
        risIssuedDate: risForm.risIssuedDate ? new Date(risForm.risIssuedDate).toISOString() : new Date().toISOString(),
        risReceivedBySystemUserId: risForm.risReceivedBySystemUserId || undefined,
        risReceivedDate: risForm.risReceivedBySystemUserId && risForm.risReceivedDate ? new Date(risForm.risReceivedDate).toISOString() : undefined,

        isActive: true,
        createdAt: risForm.createdAt ? new Date(risForm.createdAt).toISOString() : undefined,
      };

      const itemsData: EditSupplyRISItem[] = [{
        id: 0,
        risId: 0,
        stockNumber: stockNumber,
        unitId: unitId || 0,
        itemDescription: description,
        requisitionQuantity: Number(risItemForm.requisitionQuantity),
        issueQuantity: Number(risItemForm.issueQuantity),
        isAvailable: true,
        itemRemarks: risItemForm.itemRemarks,
        isActive: true,
        createdAt: risForm.createdAt ? new Date(risForm.createdAt).toISOString() : undefined,
      }];

      const result = await saveRIS(headerData, itemsData, []);
      if (result) {
        toast.success('RIS requisition recorded and automatically approved');
        onSuccess();
        if (closeAfterSave) {
          onOpenChange(false);
        } else {
          setRisForm(prev => ({
            ...prev,
            risNumber: '',
            risPurpose: '',
          }));
          setRisItemForm({
            requisitionQuantity: 1,
            issueQuantity: 1,
            itemRemarks: '',
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record RIS requisition');
    } finally {
      setLoading(false);
    }
  };

  const filteredDivisions = vwDivisions.filter((d: any) => d.office?.id === risForm.officeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto p-6 bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col gap-4">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-2xl text-slate-900 font-bold">
            Record Transaction: <span className="text-blue-600 font-mono">{stockNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full flex-1">
          <TabsList className="h-auto grid grid-cols-2 w-full bg-slate-100/80 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner mb-6">
            <TabsTrigger
              value="add-item"
              className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
            >
              <PlusCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Add Supply Stock</span>
            </TabsTrigger>
            <TabsTrigger
              value="ris"
              className="group flex items-center justify-center gap-2 rounded-lg py-2.5 font-semibold text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
            >
              <FileSpreadsheet className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>RIS (Issuance)</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Add Supply Stock (Old Delivery Bypass) */}
          <TabsContent value="add-item">
            <form onSubmit={handleAddItemSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Item Code</Label>
                  <Input value={itemForm.code} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Description</Label>
                  <Input value={itemForm.description} disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Category <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={itemForm.categoryId || 0}
                    onChange={(val) => setItemForm({ ...itemForm, categoryId: val })}
                    options={categories}
                    placeholder="Select category"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Measurement Unit <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={itemForm.measurementUnitId || 0}
                    onChange={(val) => setItemForm({ ...itemForm, measurementUnitId: val })}
                    options={units}
                    placeholder="Select unit"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Quantity to Add</Label>
                  <Input
                    type="number"
                    value={itemForm.quantity || 0}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                    className="bg-white border-slate-200 text-slate-900"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Unit Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemForm.unitCost || 0}
                    onChange={(e) => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })}
                    className="bg-white border-slate-200 text-slate-900"
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Reorder Point</Label>
                  <Input
                    type="number"
                    value={itemForm.reorderPoint || 0}
                    onChange={(e) => setItemForm({ ...itemForm, reorderPoint: Number(e.target.value) })}
                    className="bg-white border-slate-200 text-slate-900"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Storage Location <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={itemForm.storageLocationId || 0}
                    onChange={(val) => setItemForm({ ...itemForm, storageLocationId: val })}
                    options={storagelocations}
                    placeholder="Select storage location"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Vendor <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={itemForm.vendorId || 0}
                    onChange={(val) => setItemForm({ ...itemForm, vendorId: val })}
                    options={vendors}
                    placeholder="Select vendor"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Created At</Label>
                  <Input
                    type="date"
                    value={itemForm.createdAt || ''}
                    onChange={(e) => setItemForm({ ...itemForm, createdAt: e.target.value })}
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <DialogFooter className="border-t pt-4 mt-2 border-slate-100">
                <div className="flex gap-2 justify-end w-full">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={handleAddItemSaveAndAddAnother}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  >
                    Save & Add Another
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* TAB 2: RIS Requisition shortcut */}
          <TabsContent value="ris">
            <form onSubmit={handleRisSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 border p-4 bg-slate-50/50 rounded-lg border-slate-100">
                <div className="col-span-2 flex items-center justify-between pb-2 border-b">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RIS Header Information</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Entity Name</Label>
                  <Input value={risForm.entityName} onChange={(e) => setRisForm({ ...risForm, entityName: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Fund Cluster</Label>
                  <Input value={risForm.fundCluster} onChange={(e) => setRisForm({ ...risForm, fundCluster: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">RIS Number <span className="text-red-500">*</span></Label>
                  <Input required value={risForm.risNumber} onChange={(e) => setRisForm({ ...risForm, risNumber: e.target.value })} placeholder="e.g. RIS-2026-001" className="bg-white border-slate-200 text-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Responsibility Center Code (RCC) <span className="text-red-500">*</span></Label>
                  <Input required value={risForm.responsibilityCenterCode} onChange={(e) => setRisForm({ ...risForm, responsibilityCenterCode: e.target.value })} placeholder="e.g. RCC-123" className="bg-white border-slate-200 text-slate-900" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Office <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={risForm.officeId}
                    onChange={(val) => setRisForm({ ...risForm, officeId: val, divisionId: 0 })}
                    options={vwOffices}
                    placeholder="Select Office"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Division <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={risForm.divisionId}
                    onChange={(val) => setRisForm({ ...risForm, divisionId: val })}
                    options={filteredDivisions}
                    placeholder="Select Division"
                    disabled={!risForm.officeId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Requested By <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={risForm.risRequestedBySystemUserId}
                    onChange={(val) => setRisForm({ ...risForm, risRequestedBySystemUserId: val })}
                    options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
                    placeholder="Select Requester"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Date Requested</Label>
                  <Input type="date" value={risForm.risRequestedDate} onChange={(e) => setRisForm({ ...risForm, risRequestedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                {/* Approved By & Date */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Approved By <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={risForm.risApprovedBySystemUserId}
                    onChange={(val) => setRisForm({ ...risForm, risApprovedBySystemUserId: val })}
                    options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
                    placeholder="Select Approver"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Date Approved</Label>
                  <Input type="date" value={risForm.risApprovedDate} onChange={(e) => setRisForm({ ...risForm, risApprovedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                {/* Issued By & Date */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Issued By <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={risForm.risIssuedBySystemUserId}
                    onChange={(val) => setRisForm({ ...risForm, risIssuedBySystemUserId: val })}
                    options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
                    placeholder="Select Issuer"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Date Issued</Label>
                  <Input type="date" value={risForm.risIssuedDate} onChange={(e) => setRisForm({ ...risForm, risIssuedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                {/* Received By & Date */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Received By</Label>
                  <SearchableSelect
                    value={risForm.risReceivedBySystemUserId}
                    onChange={(val) => setRisForm({ ...risForm, risReceivedBySystemUserId: val })}
                    options={users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))}
                    placeholder="Select Receiver"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Date Received</Label>
                  <Input type="date" value={risForm.risReceivedDate} onChange={(e) => setRisForm({ ...risForm, risReceivedDate: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-700 font-medium">Created At</Label>
                  <Input type="date" value={risForm.createdAt} onChange={(e) => setRisForm({ ...risForm, createdAt: e.target.value })} className="bg-white border-slate-200 text-slate-900" />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-700 font-medium">Purpose <span className="text-red-500">*</span></Label>
                  <Textarea required value={risForm.risPurpose} onChange={(e) => setRisForm({ ...risForm, risPurpose: e.target.value })} placeholder="Purpose of this requisition..." className="bg-white border-slate-200 text-slate-900 min-h-[60px]" />
                </div>
              </div>

              {/* RIS Item Fields */}
              <div className="grid grid-cols-3 gap-4 border p-4 bg-blue-50/20 rounded-lg border-blue-100">
                <div className="col-span-3 pb-2 border-b">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">RIS Requisitioned Item</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Requisition Quantity</Label>
                  <Input
                    type="number"
                    value={risItemForm.requisitionQuantity}
                    disabled
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Issued Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={risItemForm.issueQuantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRisItemForm({
                        ...risItemForm,
                        issueQuantity: val,
                        requisitionQuantity: val
                      });
                    }}
                    className="bg-white border-slate-200 text-slate-900"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Remarks</Label>
                  <Input
                    value={risItemForm.itemRemarks}
                    onChange={(e) => setRisItemForm({ ...risItemForm, itemRemarks: e.target.value })}
                    placeholder="e.g. Issued completely"
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <DialogFooter className="border-t pt-4 mt-2 border-slate-100">
                <div className="flex gap-2 justify-end w-full">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={handleRisSaveAndAddAnother}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  >
                    Save & Add Another
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
