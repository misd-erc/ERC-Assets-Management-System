import { useState, useEffect, useMemo } from 'react';
import { VwSupplyItem } from '@/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Edit, Trash2, MoreHorizontal, Plus, AlertTriangle, ChevronLeft, ChevronRight, Eye, PackageSearch, ArrowUpDown, Filter, ChevronDown, ChevronUp, Loader2,
  Layers, CheckCircle2, XCircle, Tag, MapPin, Store, Check, ChevronsUpDown
} from 'lucide-react';
import { cn } from "@/components/ui/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { SupplyItemSearchBar } from './SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

interface SearchableFilterProps {
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  emptyMessage?: string;
  activeClass: string;
  inactiveClass: string;
  icon: any;
  activeIconColorClass: string;
  allLabel: string;
}

function SearchableFilter({
  value,
  onValueChange,
  options,
  placeholder,
  emptyMessage = "No results found.",
  activeClass,
  inactiveClass,
  icon: IconComponent,
  activeIconColorClass,
  allLabel
}: SearchableFilterProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border rounded-lg h-10 px-3 active:scale-[0.99] transition-all font-medium text-left shadow-sm focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500",
            value === "all" ? inactiveClass : activeClass
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconComponent className={cn("w-4 h-4 shrink-0", value === "all" ? "text-slate-400" : activeIconColorClass)} />
            <span className="truncate">
              {value === "all" ? allLabel : (selectedOption ? selectedOption.label : placeholder)}
            </span>
          </div>
          <ChevronsUpDown className={cn("ml-2 h-4 w-4 shrink-0 transition-colors duration-200", open ? "text-blue-500" : "text-slate-400 opacity-60")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-xl border border-slate-100 bg-white overflow-hidden" align="start">
        <Command className="bg-white">
          <div className="p-2 bg-slate-50/50 border-b border-slate-100">
            <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
              <CommandInput
                placeholder={placeholder}
                className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
              />
            </div>
          </div>
          <CommandList className="max-h-60 overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel}
                onSelect={() => {
                  onValueChange("all");
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                  value === "all" && "bg-blue-50/60 font-medium text-blue-700"
                )}
              >
                <div className="flex items-center min-w-0 gap-1.5">
                  <IconComponent className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate flex-1">{allLabel}</span>
                </div>
                <Check className={cn("ml-2 h-4 w-4 shrink-0 transition-all duration-200", value === "all" ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
              </CommandItem>
              {options.map(opt => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                    value === opt.value && "bg-blue-50/60 font-medium text-blue-700"
                  )}
                >
                  <div className="flex items-center min-w-0 gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate flex-1">{opt.label}</span>
                  </div>
                  <Check className={cn("ml-2 h-4 w-4 shrink-0 transition-all duration-200", value === opt.value ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


interface Props {
  data: VwSupplyItem[];
  totalCount: number;
  page: number;
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  storageFilter: string;
  vendorFilter?: string;
  allCategories?: any[];
  storageLocations?: any[];
  allVendors?: any[];
  loading?: boolean;
  onAdd: () => void;
  onView: (item: VwSupplyItem) => void;
  onEdit: (item: VwSupplyItem) => void;
  onDelete: (item: VwSupplyItem) => void;
  onParamsChange: (params: { page: number; search: string; category: string; status: string; storageId?: string; vendorId?: string }) => void;
  hideAddButton?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyItemTable = ({
  data,
  totalCount,
  page,
  searchQuery,
  categoryFilter,
  statusFilter,
  storageFilter,
  vendorFilter = "all",
  allCategories = [],
  storageLocations = [],
  allVendors = [],
  loading = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onParamsChange,
  hideAddButton = false
}: Props) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getStockStatusLabel = (item: VwSupplyItem) => {
    if (item.quantity == 0) return 'Out of Stock';
    if (item.quantity <= item.reorderPoint) return 'Low Stock';
    return 'Available';
  };

  // Categories are now passed from the parent to ensure consistency with server-side filtering.
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const storageOptions = useMemo(() => storageLocations.map(loc => ({
    value: loc.id.toString(),
    label: loc.name
  })), [storageLocations]);

  const vendorOptions = useMemo(() => allVendors.map(v => ({
    value: v.id.toString(),
    label: v.name
  })), [allVendors]);

  const handleSort = (key: string) => {
    setIsSorting(true);
    setTimeout(() => {
      setSortConfig(prev => {
        if (prev?.key === key) {
          return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: 'asc' };
      });
      setIsSorting(false);
    }, 450);
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortConfig.key === 'category') {
        aVal = a.category?.name || '';
        bVal = b.category?.name || '';
      } else if (sortConfig.key === 'storageLocation') {
        aVal = a.storageLocation?.name || '';
        bVal = b.storageLocation?.name || '';
      } else if (sortConfig.key === 'vendor') {
        aVal = a.vendor?.name || '';
        bVal = b.vendor?.name || '';
      } else {
        aVal = a[sortConfig.key as keyof VwSupplyItem];
        bVal = b[sortConfig.key as keyof VwSupplyItem];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string || '').toLowerCase();
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const updateParams = (updates: Partial<{ page: number; search: string; category: string; status: string; storageId: string; vendorId: string }>) => {
    onParamsChange({
      page: updates.page ?? page,
      search: updates.search ?? searchQuery,
      category: updates.category ?? categoryFilter,
      status: updates.status ?? statusFilter,
      storageId: updates.storageId ?? storageFilter,
      vendorId: updates.vendorId ?? vendorFilter,
    });
  };

  const getStockStatus = (item: VwSupplyItem) => {
    if (item.quantity == 0)
      return { label: 'Out of Stock', classes: 'bg-red-50 text-red-700 border-red-200' };
    else if (item.quantity <= item.reorderPoint)
      return { label: 'Low Stock', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
    else
      return { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-900">Inventory Items</CardTitle>
              <CardDescription>Manage supply items with stock monitoring</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {!hideAddButton && (
                <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="w-full md:flex-1">
              <SupplyItemSearchBar value={searchQuery} onChange={(val) => updateParams({ search: val, page: 1 })} />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={categoryFilter} onValueChange={(val) => updateParams({ category: val, page: 1 })}>
                  <SelectTrigger className={cn(
                    "w-[160px] border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium",
                    categoryFilter === 'all'
                      ? "bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                      : "bg-blue-50/50 hover:bg-blue-100/40 text-blue-700 border-blue-200 hover:border-blue-300"
                  )}>
                    <div className="flex items-center gap-2">
                      <Tag className={cn("w-4 h-4", categoryFilter === 'all' ? "text-slate-400" : "text-blue-500")} />
                      <span className="truncate">
                        {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border border-slate-100 p-1">
                    <SelectItem value="all" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center">
                        <Tag className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        All Categories
                      </div>
                    </SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name} className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center">
                          <Tag className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={statusFilter} onValueChange={(val) => updateParams({ status: val, page: 1 })}>
                <SelectTrigger className={cn(
                  "w-[160px] border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium",
                  statusFilter === 'all'
                    ? "bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                    : statusFilter === 'Available'
                    ? "bg-emerald-50/50 hover:bg-emerald-100/40 text-emerald-700 border-emerald-200 hover:border-emerald-300"
                    : statusFilter === 'Low Stock'
                    ? "bg-amber-50/50 hover:bg-amber-100/40 text-amber-700 border-amber-200 hover:border-amber-300"
                    : "bg-red-50/50 hover:bg-red-100/40 text-red-700 border-red-200 hover:border-red-300"
                )}>
                  <div className="flex items-center gap-2">
                    {statusFilter === 'all' && <Layers className="w-4 h-4 text-slate-400" />}
                    {statusFilter === 'Available' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {statusFilter === 'Low Stock' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {statusFilter === 'Out of Stock' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="truncate">
                      {statusFilter === 'all' ? 'All Status' : statusFilter}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border border-slate-100 p-1">
                  <SelectItem value="all" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                      All Status
                    </div>
                  </SelectItem>
                  <SelectItem value="Available" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value="Low Stock" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" />
                      Low Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="Out of Stock" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <XCircle className="w-3.5 h-3.5 text-red-500 mr-1.5 shrink-0" />
                      Out of Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`h-9 px-3 ${showAdvanced ? 'bg-slate-100 text-slate-900 border-slate-300' : 'text-slate-600'}`}
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showAdvanced ? 'Simple Filter' : 'Advanced Filter'}
              </Button>

              {(searchQuery || categoryFilter !== "all" || statusFilter !== "all" || storageFilter !== "all" || vendorFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateParams({ search: "", category: "all", status: "all", storageId: "all", vendorId: "all", page: 1 });
                  }}
                  className="text-slate-500 hover:text-slate-900 h-9"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Storage Location</label>
                <SearchableFilter
                  value={storageFilter}
                  onValueChange={(val) => updateParams({ storageId: val, page: 1 })}
                  options={storageOptions}
                  placeholder="Search storage location..."
                  allLabel="All Locations"
                  inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                  activeClass="bg-rose-50/50 hover:bg-rose-100/40 text-rose-700 border-rose-200 hover:border-rose-300"
                  icon={MapPin}
                  activeIconColorClass="text-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Vendor</label>
                <SearchableFilter
                  value={vendorFilter}
                  onValueChange={(val) => updateParams({ vendorId: val, page: 1 })}
                  options={vendorOptions}
                  placeholder="Search vendor..."
                  allLabel="All Vendors"
                  inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                  activeClass="bg-amber-50/50 hover:bg-amber-100/40 text-amber-700 border-amber-200 hover:border-amber-300"
                  icon={Store}
                  activeIconColorClass="text-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          {loading && data.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 dark:bg-blue-950 overflow-hidden z-10">
              <div className="h-full bg-blue-600 dark:bg-blue-400 animate-pulse w-full"></div>
            </div>
          )}
          {isSorting && (
            <div className="absolute inset-0 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3.5 z-30 animate-in fade-in duration-200">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-full shadow-inner border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Sorting Inventory Items...</span>
                <span className="text-xs text-slate-400 font-medium">Arranging stock entries by column</span>
              </div>
            </div>
          )}
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[150px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    Item Code <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="min-w-[200px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-1">
                    Description <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('storageLocation')}>
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('vendor')}>
                  <div className="flex items-center gap-1">
                    Vendor <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-1">
                    Quantity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Reorder Pt.</TableHead>
                <TableHead className="text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('unitCost')}>
                  <div className="flex items-center justify-end gap-1">
                    Unit Cost <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {/* 10 columns to match the 10 TableHead items */}
                    {Array.from({ length: 10 }).map((_, colIndex) => (
                      <TableCell key={`skel-col-${colIndex}`}>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedData.length > 0 ? (
                // NORMAL DATA RENDERING
                sortedData.map((item) => {
                  const status = getStockStatus(item);
                  // Using currentStock logic from your original code
                  const isLowStock = item.currentStock > 0 && item.currentStock <= item.reorderPoint;

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.code}</div>
                        {item.iarId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            IAR-{item.iarId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate font-medium text-slate-700" title={item.description}>
                          {item.description}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.measurementUnit?.name || 'No Unit'}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{item.category?.name}</TableCell>
                      <TableCell className="text-slate-600">{item.storageLocation?.name}</TableCell>
                      <TableCell className="text-slate-600 max-w-[150px] truncate" title={item.vendor?.name}>
                        {item.vendor?.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 font-medium">
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={item.quantity == 0 ? 'text-red-600' : 'text-slate-900'}>
                            {item.quantity ?? 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-600">{item.reorderPoint}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">{formatCurrency(item.unitCost)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${status.classes} whitespace-nowrap`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onView(item)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2 text-blue-500" /> Edit Item
                            </DropdownMenuItem>
                            {/* {!item.iarId && (
                              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Item
                              </DropdownMenuItem>
                            )} */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                // EMPTY STATE
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <PackageSearch className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900">No items found</p>
                      <p className="text-sm">
                        {searchQuery ? "Try adjusting your search criteria." : "Get started by adding a new supply item."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 font-medium">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => updateParams({ page: Math.max(1, page - 1) })} disabled={page === 1 || loading} className="shadow-sm">
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ChevronLeft className="w-4 h-4 mr-1" />} Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })} disabled={page === totalPages || loading} className="shadow-sm">
                Next {loading ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};