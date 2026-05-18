import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplyUnit, useVendor, useSupplyItem } from '@/hooks';
import { useSupplyStorageLocationStore } from '@/store/supply';
import { getCategories } from '@/api/asset/inventoryApi';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: any) => void;
}

export const DeliveryItemModal = ({ open, onOpenChange, onSave }: Props) => {
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const { vendors, fetchVendors } = useVendor();
  const { storagelocations, fetchSupplyStorageLocations } = useSupplyStorageLocationStore();
  const { vwUniqueRawSupplies, fetchSupplyUniqueRawItems } = useSupplyItem();

  const [categories, setCategories] = useState<any[]>([]);
  const [isNewItem, setIsNewItem] = useState(false);

  const [openItemType, setOpenItemType] = useState(false);
  const [activeItemType, setActiveItemType] = useState("");
  const [openCategory, setOpenCategory] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [openItemCode, setOpenItemCode] = useState(false);
  const [activeItemCode, setActiveItemCode] = useState("");
  const [openLocation, setOpenLocation] = useState(false);
  const [activeLocation, setActiveLocation] = useState("");
  const [openVendor, setOpenVendor] = useState(false);
  const [activeVendor, setActiveVendor] = useState("");
  const [openUnit, setOpenUnit] = useState(false);
  const [activeUnit, setActiveUnit] = useState("");

  const [item, setItem] = useState({
    itemTypeId: 1,
    categoryId: 0,
    itemDescription: '',
    itemQuantity: 0,
    measurementUnitId: 0,
    unitCost: 0,
    code: '',
    reorderPoint: 0,
    storageLocationId: 0,
    vendorId: 0
  });

  useEffect(() => {
    if (open) {
      fetchSupplyUnits();
      fetchVendors();
      fetchSupplyStorageLocations();
      fetchSupplyUniqueRawItems();
      getCategories().then(setCategories);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setIsNewItem(false);
    setItem({
      itemTypeId: 1, categoryId: 0, itemDescription: '',
      itemQuantity: 0, measurementUnitId: 0, unitCost: 0,
      code: '', reorderPoint: 0,
      storageLocationId: 0, vendorId: 0
    });
  };

  const handleCodeChange = (val: string) => {
    if (val === "NEW_ITEM") {
      setIsNewItem(true);
      setItem(prev => ({
        ...prev,
        code: '',
        itemDescription: '',
        categoryId: 0,
        storageLocationId: 0,
        vendorId: 0,
        reorderPoint: 0
      }));
    } else {
      setIsNewItem(false);
      const selected = vwUniqueRawSupplies.find(s => s.code === val);
      if (selected) {
        setItem(prev => ({
          ...prev,
          code: selected.code,
          itemDescription: selected.description,
          categoryId: selected.category?.id || 0,
          storageLocationId: selected.storageLocation?.id || 0,
          vendorId: selected.vendor?.id || 0,
          reorderPoint: (selected as any).reorderPoint || 0
        }));
      }
    }
  };

  const validate = () => {
    if (!item.itemDescription) {
      toast.error('Description is required');
      return false;
    }
    if (item.itemQuantity < 0) {
      toast.error('Quantity cannot be negative');
      return false;
    }
    if (item.unitCost < 0) {
      toast.error('Unit cost cannot be negative');
      return false;
    }
    return true;
  };

  const processSubmit = (closeAfterSave: boolean) => {
    if (!validate()) return;

    const categoryObj = categories.find(c => c.id === Number(item.categoryId));
    const unitObj = units.find(u => u.id === Number(item.measurementUnitId));
    const vendorObj = vendors.find(v => v.id === Number(item.vendorId));
    const locationObj = storagelocations.find(l => l.id === Number(item.storageLocationId));

    onSave({
      ...item,
      category: categoryObj,
      measurementUnit: unitObj,
      vendor: vendorObj,
      storageLocation: locationObj
    });

    if (closeAfterSave) {
      onOpenChange(false);
    } else {
      toast.success('Item added to delivery record!');

      setItem(prev => ({
        ...prev,
        itemQuantity: 0,
        unitCost: 0,
        reorderPoint: 0
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSubmit(true);
  };

  const handleSaveAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    processSubmit(false);
  };

  const isSupply = item.itemTypeId === 1;
  const isExistingItem = isSupply && !isNewItem && item.code !== '';

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-7xl !w-[60vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Delivery Item</DialogTitle>
            <DialogDescription>Enter item details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

              {/* ITEM TYPE */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Item Type</Label>
                <Popover open={openItemType} onOpenChange={(open) => {
                  setOpenItemType(open);
                  if (open) {
                    const types = [{ id: 1, label: "Supply" }, { id: 2, label: "PPE" }, { id: 3, label: "Semi-Expendable" }];
                    const type = types.find(t => t.id === item.itemTypeId);
                    setActiveItemType(type ? type.label : "");
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors font-normal"
                    >
                  <span className="truncate text-slate-700">
                    {item.itemTypeId === 1 && "Supply"}
                    {item.itemTypeId === 2 && "PPE"}
                    {item.itemTypeId === 3 && "Semi-Expendable"}
                    {!item.itemTypeId && "Select Item Type"}
                  </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                    <Command className="bg-white" value={activeItemType} onValueChange={setActiveItemType}>
                      <div className="p-2 bg-slate-50 border-b border-slate-100">
                        <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                          <CommandInput
                              placeholder="Search type..."
                              className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-40 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                        <CommandEmpty className="py-4 text-center text-sm text-slate-500">No type found.</CommandEmpty>
                        <CommandGroup className="p-1.5">
                          {[
                            { id: 1, label: "Supply" },
                            { id: 2, label: "PPE" },
                            { id: 3, label: "Semi-Expendable" },
                          ].map((type) => (
                              <CommandItem
                                  key={type.id}
                                  value={type.label}
                                  onSelect={() => {
                                    const typeId = type.id;
                                    setItem({ ...item, itemTypeId: typeId });
                                    if (typeId !== 1) setIsNewItem(true);
                                    setOpenItemType(false);
                                  }}
                                  className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                              >
                                <span className="flex-1">{type.label}</span>
                                <Check className={`ml-2 h-4 w-4 shrink-0 transition-all ${item.itemTypeId === type.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* CATEGORY */}
              <div className="space-y-2 min-w-0 flex flex-col">
                <Label className="text-slate-700 font-medium">Category</Label>
                <Popover open={openCategory} onOpenChange={(open) => {
                  setOpenCategory(open);
                  if (open) {
                    const c = categories.find(c => c.id === item.categoryId);
                    setActiveCategory(c ? c.name : "");
                  }
                }}>
                  <PopoverTrigger asChild disabled={isExistingItem && item.categoryId !== 0}>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between [&>span]:truncate text-left font-normal px-3 hover:bg-slate-50 border-slate-200 shadow-sm transition-colors ${
                            isExistingItem && item.categoryId !== 0 ? "bg-slate-50 opacity-70" : "bg-white"
                        }`}
                    >
                    <span className="truncate text-slate-700">
                      {item.categoryId !== 0
                          ? categories.find((c) => c.id === item.categoryId)?.name || "Select Category"
                          : "Select Category"}
                    </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                    <Command className="bg-white" value={activeCategory} onValueChange={setActiveCategory}>
                      <div className="p-2 bg-slate-50 border-b border-slate-100">
                        <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                          <CommandInput
                              placeholder="Search category..."
                              className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">No category found.</CommandEmpty>
                        <CommandGroup className="p-1.5">
                          <CommandItem
                              onSelect={() => { setItem({ ...item, categoryId: 0 }); setOpenCategory(false); }}
                              className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50"
                          >
                            <span className="truncate flex-1">Clear Selection</span>
                          </CommandItem>
                          {categories.map((c) => (
                              <CommandItem
                                  key={c.id}
                                  value={c.name}
                                  onSelect={() => { setItem({ ...item, categoryId: c.id }); setOpenCategory(false); }}
                                  className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                              >
                                <span className="truncate flex-1">{c.name}</span>
                                <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${item.categoryId === c.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* ITEM CODE */}
            <div className="space-y-2 min-w-0 flex flex-col">
              <Label className="text-slate-700 font-medium">Item Code</Label>
              {isSupply ? (
                  isNewItem ? (
                      <div className="flex gap-2">
                        <Input
                            value={item.code}
                            onChange={e => setItem({...item, code: e.target.value})}
                            placeholder="Enter new item code"
                            required
                            className="border-slate-300 focus-visible:ring-blue-500 shadow-sm"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsNewItem(false)}
                            className="h-10 bg-white hover:bg-slate-50 border-slate-200"
                        >
                          Cancel
                        </Button>
                      </div>
                  ) : (
                      <Popover open={openItemCode} onOpenChange={(open) => {
                        setOpenItemCode(open);
                        if (open) {
                          const s = vwUniqueRawSupplies.find(s => s.code === item.code);
                          setActiveItemCode(s ? `${s.code} ${s.description}` : "");
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between [&>span]:truncate text-left font-normal px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors"
                          >
                          <span className="truncate text-slate-700">
                            {item.code
                                ? vwUniqueRawSupplies
                                .filter((s) => s.code === item.code)
                                .map((s) => `${s.code} - ${s.description}`)[0] || item.code
                                : "Select or search item code"}
                          </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                          <Command className="bg-white" value={activeItemCode} onValueChange={setActiveItemCode}>
                            <div className="p-2 bg-slate-50 border-b border-slate-100">
                              <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                                <CommandInput
                                    placeholder="Search code or description..."
                                    className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                                />
                              </div>
                            </div>
                            <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                              <CommandEmpty className="py-6 text-center text-sm text-slate-500">No item found.</CommandEmpty>
                              <CommandGroup className="p-1.5">
                                <CommandItem
                                    onSelect={() => { handleCodeChange("NEW_ITEM"); setOpenItemCode(false); }}
                                    className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors font-medium text-blue-600 italic hover:bg-blue-50"
                                >
                                  <span className="truncate flex-1">+ Add New Item Reference</span>
                                </CommandItem>
                                {vwUniqueRawSupplies.map((s) => (
                                    <CommandItem
                                        key={s.id}
                                        value={`${s.code} ${s.description}`}
                                        onSelect={() => { handleCodeChange(s.code); setOpenItemCode(false); }}
                                        className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700"
                                    >
                                      <span className="truncate flex-1">{s.code} - {s.description}</span>
                                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${item.code === s.code ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                  )
              ) : (
                  <Input
                      value={item.code}
                      onChange={e => setItem({...item, code: e.target.value})}
                      placeholder="Enter Code"
                      className="border-slate-300 focus-visible:ring-blue-500 shadow-sm"
                  />
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                  value={item.itemDescription}
                  onChange={e => setItem({...item, itemDescription: e.target.value})}
                  placeholder="Item name/description"
                  required
                  disabled={isExistingItem}
                  className={isExistingItem ? "bg-slate-50" : ""}
              />
            </div>

            {isSupply && (
                <div className="p-4 bg-slate-50/50 border rounded-md space-y-4">
                  <div className="grid grid-cols-2 gap-4">

                    {/* STORAGE LOCATION */}
                    <div className="space-y-2 min-w-0 flex flex-col">
                      <Label className="text-slate-700 font-medium">Storage Location</Label>
                      <Popover open={openLocation} onOpenChange={(open) => {
                        setOpenLocation(open);
                        if (open) {
                          const l = storagelocations.find(l => l.id === item.storageLocationId);
                          setActiveLocation(l ? l.name : "");
                        }
                      }}>
                        <PopoverTrigger asChild disabled={isExistingItem && item.storageLocationId !== 0}>
                          <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between [&>span]:truncate text-left font-normal px-3 hover:bg-slate-50 border-slate-200 shadow-sm transition-colors ${
                                  isExistingItem && item.storageLocationId !== 0 ? "bg-slate-50 opacity-70" : "bg-white"
                              }`}
                          >
                        <span className="truncate text-slate-700">
                          {item.storageLocationId !== 0
                              ? storagelocations.find((l) => l.id === item.storageLocationId)?.name || "Select Location"
                              : "Select Location"}
                        </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                          <Command className="bg-white" value={activeLocation} onValueChange={setActiveLocation}>
                            <div className="p-2 bg-slate-50 border-b border-slate-100">
                              <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                                <CommandInput placeholder="Search location..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                              </div>
                            </div>
                            <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                              <CommandEmpty className="py-6 text-center text-sm text-slate-500">No location found.</CommandEmpty>
                              <CommandGroup className="p-1.5">
                                <CommandItem onSelect={() => { setItem({ ...item, storageLocationId: 0 }); setOpenLocation(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50">
                                  <span className="truncate flex-1">Clear Selection</span>
                                </CommandItem>
                                {storagelocations.map((l) => (
                                    <CommandItem key={l.id} value={l.name} onSelect={() => { setItem({ ...item, storageLocationId: l.id }); setOpenLocation(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700">
                                      <span className="truncate flex-1">{l.name}</span>
                                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${item.storageLocationId === l.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* VENDOR */}
                    <div className="space-y-2 min-w-0 flex flex-col">
                      <Label className="text-slate-700 font-medium">Vendor</Label>
                      <Popover open={openVendor} onOpenChange={(open) => {
                        setOpenVendor(open);
                        if (open) {
                          const v = vendors.find(v => v.id === item.vendorId);
                          setActiveVendor(v ? v.name : "");
                        }
                      }}>
                        <PopoverTrigger asChild disabled={isExistingItem && item.vendorId !== 0}>
                          <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between [&>span]:truncate text-left font-normal px-3 hover:bg-slate-50 border-slate-200 shadow-sm transition-colors ${
                                  isExistingItem && item.vendorId !== 0 ? "bg-slate-50 opacity-70" : "bg-white"
                              }`}
                          >
                        <span className="truncate text-slate-700">
                          {item.vendorId !== 0
                              ? vendors.find((v) => v.id === item.vendorId)?.name || "Select Vendor"
                              : "Select Vendor"}
                        </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                          <Command className="bg-white" value={activeVendor} onValueChange={setActiveVendor}>
                            <div className="p-2 bg-slate-50 border-b border-slate-100">
                              <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                                <CommandInput placeholder="Search vendor..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                              </div>
                            </div>
                            <CommandList className="max-h-60 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                              <CommandEmpty className="py-6 text-center text-sm text-slate-500">No vendor found.</CommandEmpty>
                              <CommandGroup className="p-1.5">
                                <CommandItem onSelect={() => { setItem({ ...item, vendorId: 0 }); setOpenVendor(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors text-slate-500 italic hover:bg-slate-50">
                                  <span className="truncate flex-1">Clear Selection</span>
                                </CommandItem>
                                {vendors.map((v) => (
                                    <CommandItem key={v.id} value={v.name} onSelect={() => { setItem({ ...item, vendorId: v.id }); setOpenVendor(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700">
                                      <span className="truncate flex-1">{v.name}</span>
                                      <Check className={`ml-2 h-4 w-4 shrink-0 transition-all duration-200 ${item.vendorId === v.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                                    </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* REORDER POINT */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reorderPoint" className="text-slate-700 font-medium">Reorder Point</Label>
                      <Input
                          id="reorderPoint"
                          type="number"
                          min="0"
                          placeholder="0"
                          required={isSupply}
                          value={item.reorderPoint === 0 ? "" : item.reorderPoint}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItem({ ...item, reorderPoint: val === "" ? 0 : Number(val) });
                          }}
                          onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                          className="bg-white border-slate-200 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">

              {/* QUANTITY */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-700 font-medium">Quantity</Label>
                <Input
                    id="quantity"
                    type="number"
                    placeholder="0"
                    value={item.itemQuantity === 0 ? "" : item.itemQuantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItem({ ...item, itemQuantity: val === "" ? 0 : Number(val) });
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                    className="bg-white border-slate-200 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* UNIT */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Unit</Label>
                <Popover open={openUnit} onOpenChange={(open) => {
                  setOpenUnit(open);
                  if (open) {
                    const u = units.find(u => u.id === item.measurementUnitId);
                    setActiveUnit(u ? u.name : "");
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between px-3 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-colors font-normal"
                    >
                    <span className="truncate text-slate-700">
                      {item.measurementUnitId
                          ? units.find((u) => u.id === item.measurementUnitId)?.name || "Select Unit"
                          : "Select Unit"}
                    </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-lg shadow-lg border-slate-200 overflow-hidden">
                    <Command className="bg-white" value={activeUnit} onValueChange={setActiveUnit}>
                      <div className="p-2 bg-slate-50 border-b border-slate-100">
                        <div className="relative rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                          <CommandInput placeholder="Search units..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                        </div>
                      </div>
                      <CommandList className="max-h-48 overflow-y-auto overscroll-contain" onWheelCapture={(e) => e.stopPropagation()}>
                        <CommandEmpty className="py-4 text-center text-sm text-slate-500">No unit found.</CommandEmpty>
                        <CommandGroup className="p-1.5">
                          <CommandItem onSelect={() => { setItem({ ...item, measurementUnitId: 0 }); setOpenUnit(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer text-slate-500 italic hover:bg-slate-50">
                            <span>Select Unit</span>
                          </CommandItem>
                          {units.map((u) => (
                              <CommandItem key={u.id} value={u.name} onSelect={() => { setItem({ ...item, measurementUnitId: u.id }); setOpenUnit(false); }} className="flex items-center justify-between rounded-md px-3 py-2 my-0.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700">
                                <span className="flex-1">{u.name}</span>
                                <Check className={`ml-2 h-4 w-4 shrink-0 transition-all ${item.measurementUnitId === u.id ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75"}`} />
                              </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* UNIT COST */}
              <div className="space-y-2">
                <Label htmlFor="unitCost" className="text-slate-700 font-medium">Unit Cost</Label>
                <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={item.unitCost === 0 ? "" : item.unitCost}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItem({ ...item, unitCost: val === "" ? 0 : Number(val) });
                    }}
                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                    className="bg-white border-slate-200 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 mt-2 border-t border-slate-100">
              <div className="flex gap-2 justify-end w-full">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveAndAddAnother}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  Save & Add Another
                </Button>

                <Button type="submit">
                  Save & Close
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
};