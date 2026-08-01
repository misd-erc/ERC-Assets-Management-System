import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Edit, Trash2, MoreHorizontal, Eye, CheckCircle, FileQuestion, Package,
  Search, Filter, ChevronLeft, ChevronRight, PackageSearch, Plus, Loader2, ClipboardCheck,
  Layers, CheckCircle2, Clock, Building2, Store, Check, ChevronsUpDown
} from 'lucide-react';
import { cn } from "@/components/ui/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { VwSupplyIAR } from '@/types';

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
            "w-[160px] justify-between border rounded-lg h-9 px-3 active:scale-[0.99] transition-all font-medium text-left shadow-sm focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500",
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
  data: VwSupplyIAR[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: string;
  vendorFilter?: number;
  officeFilter?: number;
  divisionFilter?: number;
  vendors?: any[];
  offices?: any[];
  divisions?: any[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (record: VwSupplyIAR) => void;
  onDelete: (record: VwSupplyIAR) => void;
  onView: (record: VwSupplyIAR) => void;
  onApprove: (record: VwSupplyIAR) => void;
  onParamsChange: (params: { page?: number; search?: string; status?: string; vendorId?: number; officeId?: number; divisionId?: number }) => void;
}

export const SupplyIARTable = ({
  data,
  totalCount,
  page,
  pageSize,
  searchQuery,
  statusFilter,
  vendorFilter,
  officeFilter,
  divisionFilter,
  vendors = [],
  offices = [],
  divisions = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onParamsChange
}: Props) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  const vendorOptions = useMemo(() => vendors.map(v => ({ value: v.id.toString(), label: v.name })), [vendors]);
  const officeOptions = useMemo(() => offices.map(o => ({ value: o.id.toString(), label: o.acronym })), [offices]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" /> Inspection & Acceptance Reports
              </CardTitle>
              <CardDescription>Manage official IAR documentation</CardDescription>
            </div>
            <Button
              onClick={onAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-300 rounded-xl px-5 py-2.5 flex items-center gap-2 border-0"
            >
              <Plus className="w-4 h-4" />
              <span>Generate IAR</span>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search IAR#, DR#, PO#, or Entity..."
                value={searchQuery}
                onChange={(e) => onParamsChange({ search: e.target.value, page: 1 })}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={(val) => onParamsChange({ status: val, page: 1 })}>
                  <SelectTrigger className={cn(
                    "w-[140px] border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium",
                    statusFilter === 'all'
                      ? "bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                      : statusFilter === 'Approved'
                      ? "bg-emerald-50/50 hover:bg-emerald-100/40 text-emerald-700 border-emerald-200 hover:border-emerald-300"
                      : "bg-amber-50/50 hover:bg-amber-100/40 text-amber-700 border-amber-200 hover:border-amber-300"
                  )}>
                    <div className="flex items-center gap-2">
                      {statusFilter === 'all' && <Layers className="w-4 h-4 text-slate-400" />}
                      {statusFilter === 'Approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {statusFilter === 'Pending' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
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
                    <SelectItem value="Approved" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />
                        Approved
                      </div>
                    </SelectItem>
                    <SelectItem value="Pending" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" />
                        Pending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <SearchableFilter
                value={vendorFilter?.toString() || "all"}
                onValueChange={(val) => onParamsChange({ vendorId: val === "all" ? undefined : Number(val), page: 1 })}
                options={vendorOptions}
                placeholder="Search vendors..."
                inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                activeClass="bg-amber-50/50 hover:bg-amber-100/40 text-amber-700 border-amber-200 hover:border-amber-300"
                icon={Store}
                activeIconColorClass="text-amber-500"
                allLabel="All Vendors"
              />

              <SearchableFilter
                value={officeFilter?.toString() || "all"}
                onValueChange={(val) => onParamsChange({ officeId: val === "all" ? undefined : Number(val), page: 1 })}
                options={officeOptions}
                placeholder="Search offices..."
                inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                activeClass="bg-blue-50/50 hover:bg-blue-100/40 text-blue-700 border-blue-200 hover:border-blue-300"
                icon={Building2}
                activeIconColorClass="text-blue-500"
                allLabel="All Offices"
              />

              {(searchQuery || statusFilter !== "all" || vendorFilter || officeFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onParamsChange({ search: "", status: "all", vendorId: undefined, officeId: undefined, page: 1 })}
                  className="text-slate-500 hover:text-slate-900 h-9"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          {loading && data.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 dark:bg-blue-950 overflow-hidden z-10">
              <div className="h-full bg-blue-600 dark:bg-blue-400 animate-pulse w-full"></div>
            </div>
          )}
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-semibold">IAR Number</TableHead>
                <TableHead className="font-semibold">Linked DR</TableHead>
                <TableHead className="font-semibold">Vendor</TableHead>
                <TableHead className="font-semibold">Office / Div</TableHead>
                <TableHead className="font-semibold">PO Number</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><div className="h-10 w-full bg-slate-100 animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : data.length > 0 ? (
                data.map((record: VwSupplyIAR) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-blue-600">{record.iarNumber}</TableCell>
                    <TableCell>
                      {record.drNumber ? (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-blue-700">{record.drNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-slate-700" title={record.vendor?.name}>
                      {record.vendor?.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium text-slate-900">{record.office?.acronym || 'N/A'}</p>
                        <p className="text-slate-500">{record.division?.acronym || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{record.poNumber}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={record.isApproved ? 'default' : 'secondary'}
                        className={record.isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                      >
                        {record.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!record.isApproved && (
                            <>
                              <DropdownMenuItem onClick={() => onApprove(record)} className="text-emerald-600 cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve Record
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onView(record)} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                          </DropdownMenuItem>
                          {!record.isApproved && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(record)} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2 text-amber-500" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <PackageSearch className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">No IAR records found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start by generating a new report'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                        Generate IAR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParamsChange({ page: Math.max(1, page - 1) })}
                disabled={page === 1 || loading}
                className="shadow-sm bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 rounded-lg active:scale-95 transition-all duration-200"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ChevronLeft className="w-4 h-4 mr-1" />} Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onParamsChange({ page: Math.min(totalPages, page + 1) })}
                disabled={page === totalPages || loading}
                className="shadow-sm bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 rounded-lg active:scale-95 transition-all duration-200"
              >
                Next {loading ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};