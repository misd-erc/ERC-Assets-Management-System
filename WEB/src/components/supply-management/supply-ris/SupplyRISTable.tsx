// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useMemo } from 'react';
import { VwSupplyRIS } from '@/types/supply/ris';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  SearchX,
  CheckCircle,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronUp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar,
  Loader2,
  Clock,
  Building2,
  Network,
  Layers,
  CheckCircle2,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from "@/components/ui/utils";
import { Input } from '@/components/ui/input';
import { VwOffice, VwDivision } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatDate } from '@/utils/dateUtils';
import { SupplyItemSearchBar } from '../supply-item/SupplyItemSearchBar'; // Adjust path if needed

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
  data: VwSupplyRIS[];
  totalCount: number;
  page: number;
  searchQuery: string;
  statusFilter: string;
  officeFilter: string;
  divisionFilter: string;
  startDate?: string;
  endDate?: string;
  offices?: VwOffice[];
  divisions?: VwDivision[];
  onAdd: () => void;
  onEdit: (ris: VwSupplyRIS) => void;
  onView: (ris: VwSupplyRIS) => void;
  onDelete: (ris: VwSupplyRIS) => void;
  onApprove: (ris: VwSupplyRIS) => void;
  onParamsChange: (params: {
    page: number;
    search: string;
    status: string;
    officeId?: string;
    divisionId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyRISTable = ({
  data,
  totalCount,
  page,
  searchQuery,
  statusFilter,
  officeFilter,
  divisionFilter,
  startDate,
  endDate,
  offices = [],
  divisions = [],
  onAdd,
  onEdit,
  onView,
  onDelete,
  onApprove,
  onParamsChange,
  loading = false,
}: Props) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const officeOptions = useMemo(() => offices.map(off => ({
    value: off.id.toString(),
    label: off.acronym
  })), [offices]);

  const divisionOptions = useMemo(() => {
    const filtered = divisions.filter(d => officeFilter === 'all' || d.office?.id === Number(officeFilter));
    return filtered.map(div => ({
      value: div.id.toString(),
      label: div.acronym
    }));
  }, [divisions, officeFilter]);

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

      if (sortConfig.key === 'office') {
        aVal = a.office?.acronym || '';
        bVal = b.office?.acronym || '';
      } else if (sortConfig.key === 'requestedBySystemUser') {
        aVal = a.requestedBySystemUser ? `${a.requestedBySystemUser.firstName} ${a.requestedBySystemUser.lastName}` : '';
        bVal = b.requestedBySystemUser ? `${b.requestedBySystemUser.firstName} ${b.requestedBySystemUser.lastName}` : '';
      } else {
        aVal = a[sortConfig.key as keyof VwSupplyRIS];
        bVal = b[sortConfig.key as keyof VwSupplyRIS];
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

  const updateParams = (updates: Partial<{
    page: number;
    search: string;
    status: string;
    officeId: string;
    divisionId: string;
    startDate: string;
    endDate: string;
  }>) => {
    onParamsChange({
      page: updates.page ?? page,
      search: updates.search ?? searchQuery,
      status: updates.status ?? statusFilter,
      officeId: updates.officeId ?? officeFilter,
      divisionId: updates.divisionId ?? divisionFilter,
      startDate: updates.startDate ?? startDate,
      endDate: updates.endDate ?? endDate,
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      {/* UX ENHANCEMENT: Unified Header Toolbar */}
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Requisition & Issue Slips
              </CardTitle>
              <CardDescription>Manage supply requisitions, approvals, and issuance</CardDescription>
            </div>

            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" /> Create RIS
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="w-full md:flex-1">
              <SupplyItemSearchBar value={searchQuery} onChange={(val) => updateParams({ search: val, page: 1 })} />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={statusFilter} onValueChange={(val) => updateParams({ status: val, page: 1 })}>
                <SelectTrigger className={cn(
                  "w-[180px] border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium",
                  statusFilter === 'all'
                    ? "bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                    : statusFilter === 'Pending'
                    ? "bg-amber-50/50 hover:bg-amber-100/40 text-amber-700 border-amber-200 hover:border-amber-300"
                    : "bg-emerald-50/50 hover:bg-emerald-100/40 text-emerald-700 border-emerald-200 hover:border-emerald-300"
                )}>
                  <div className="flex items-center gap-2">
                    {statusFilter === 'all' && <Layers className="w-4 h-4 text-slate-400" />}
                    {statusFilter === 'Pending' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                    {statusFilter === 'Approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
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
                  <SelectItem value="Pending" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="Approved" className="rounded-lg py-1.5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" />
                      Approved
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
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>

              {(searchQuery || statusFilter !== "all" || officeFilter !== "all" || divisionFilter !== "all" || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateParams({
                      search: "",
                      status: "all",
                      officeId: "all",
                      divisionId: "all",
                      startDate: "",
                      endDate: "",
                      page: 1
                    });
                  }}
                  className="text-slate-500 hover:text-slate-900 h-9"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Office</label>
                <SearchableFilter
                  value={officeFilter}
                  onValueChange={(val) => updateParams({ officeId: val, page: 1 })}
                  options={officeOptions}
                  placeholder="Search office..."
                  allLabel="All Offices"
                  inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                  activeClass="bg-blue-50/50 hover:bg-blue-100/40 text-blue-700 border-blue-200 hover:border-blue-300"
                  icon={Building2}
                  activeIconColorClass="text-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">Division</label>
                <SearchableFilter
                  value={divisionFilter}
                  onValueChange={(val) => updateParams({ divisionId: val, page: 1 })}
                  options={divisionOptions}
                  placeholder="Search division..."
                  allLabel="All Divisions"
                  inactiveClass="bg-slate-50/40 hover:bg-slate-100/40 text-slate-700 border-slate-200 hover:border-slate-300"
                  activeClass="bg-indigo-50/50 hover:bg-indigo-100/40 text-indigo-700 border-indigo-200 hover:border-indigo-300"
                  icon={Network}
                  activeIconColorClass="text-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">From Date</label>
                <Input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => updateParams({ startDate: e.target.value, page: 1 })}
                  className={cn(
                    "bg-white border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium text-slate-700 w-full cursor-pointer",
                    startDate
                      ? "bg-blue-50/50 border-blue-200 text-blue-700"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 ml-1">To Date</label>
                <Input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => updateParams({ endDate: e.target.value, page: 1 })}
                  className={cn(
                    "bg-white border rounded-lg h-9 px-3 transition-all focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 shadow-sm font-medium text-slate-700 w-full cursor-pointer",
                    endDate
                      ? "bg-blue-50/50 border-blue-200 text-blue-700"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  )}
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
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Sorting Requisitions...</span>
                <span className="text-xs text-slate-400 font-medium">Ordering issue slips by column</span>
              </div>
            </div>
          )}
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[150px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('risRequestedDate')}>
                  <div className="flex items-center gap-1">
                    Requested Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="w-[180px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('risNumber')}>
                  <div className="flex items-center gap-1">
                    RIS Number <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('office')}>
                  <div className="flex items-center gap-1">
                    Office / Division <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('requestedBySystemUser')}>
                  <div className="flex items-center gap-1">
                    Requested By <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center w-[120px]">Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* SKELETON LOADER */}
              {loading && data.length === 0 ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((_, colIndex) => (
                      <TableCell key={`skel-col-${colIndex}`}>
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedData.length > 0 ? (
                // NORMAL DATA RENDERING
                sortedData.map((ris) => {
                  const isApproved = ris.isApproved;
                  const statusLabel = isApproved ? 'Approved' : 'Pending';
                  const statusClasses = isApproved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <TableRow key={ris.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-slate-600">
                        {formatDate(ris.risRequestedDate)}
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-900">{ris.risNumber}</span>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-700">
                          {ris.office?.acronym || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {ris.division?.acronym || 'No Division'}
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-700 font-medium">
                        {ris.requestedBySystemUser?.firstName} {ris.requestedBySystemUser?.lastName}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${statusClasses} whitespace-nowrap`}>
                          {statusLabel}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {!isApproved && (
                              <DropdownMenuItem onClick={() => onApprove(ris)} className="cursor-pointer">
                                <CheckCircle className={`w-4 h-4 mr-2 ${isApproved ? 'text-amber-500' : 'text-emerald-500'}`} />
                                Approve RIS
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => onView(ris)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            {!isApproved && (
                              <>
                                <DropdownMenuItem onClick={() => onEdit(ris)} className="cursor-pointer">
                                  <Edit className="w-4 h-4 mr-2 text-blue-500" /> Edit RIS
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDelete(ris)}
                                  className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete RIS
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                // POLISHED EMPTY STATE
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                      <div className="p-3 bg-slate-50 rounded-full">
                        <SearchX className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900">No Requisition Slips found</p>
                      <p className="text-sm">
                        {searchQuery ? "Try adjusting your search criteria." : "Get started by creating a new RIS."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                disabled={page === 1 || loading}
                className="shadow-sm bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 rounded-lg active:scale-95 transition-all duration-200"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ChevronLeft className="h-4 w-4 mr-1" />} Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
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