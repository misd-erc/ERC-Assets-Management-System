import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Filter, X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { getDivisions } from '@/api/office-management/divisionApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getCategories, getConditions } from '@/api/asset/inventoryApi';
import { getEmployees } from '@/api/user-management/userApi';
import { VwDivision, Office } from '@/types/office';

interface AssetsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  conditionFilter: string;
  onConditionFilterChange: (value: string) => void;
  officeFilter: string;
  onOfficeFilterChange: (value: string) => void;
  divisionFilter: string;
  onDivisionFilterChange: (value: string) => void;
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  onApplyFilters?: () => void;
  totalResults: number;
  /** Restrict the Category dropdown to this module ('PPE' or 'SE'). Omit to show both, excluding 'Supply'. */
  moduleFilter?: string;
}

export function AssetsFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  conditionFilter,
  onConditionFilterChange,
  officeFilter,
  onOfficeFilterChange,
  divisionFilter,
  onDivisionFilterChange,
  employeeFilter,
  onEmployeeFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  onApplyFilters,
  totalResults,
  moduleFilter,
}: AssetsFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onApplyFilters?.();
  };
  const [categories, setCategories] = useState<{ id: number; name: string; module?: string }[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [employees, setEmployees] = useState<{ id: number; label: string }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [divisionOpen, setDivisionOpen] = useState(false);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesData, conditionsData, officesData, divisionsData, employeesData] = await Promise.all([
          getCategories(),
          getConditions(),
          getOffices(),
          getDivisions(),
          getEmployees(1, 10000),
        ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setConditions(Array.isArray(conditionsData) ? conditionsData : []);
        setOffices(Array.isArray(officesData) ? officesData : []);
        setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
        const empItems = employeesData?.data?.items ?? [];
        setEmployees(empItems.map((e: any) => ({
          id: e.id,
          label: [e.lastName, e.firstName, e.middleName].filter(Boolean).join(', ') +
            (e.employeeIdOriginal ? ` — ${e.employeeIdOriginal}` : ''),
        })));
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  const visibleCategories = categories.filter(c =>
    moduleFilter ? c.module === moduleFilter : c.module !== 'Supply'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="size-5 text-blue-600" />
          Filters
        </CardTitle>
        <CardDescription>
          Filter assets by various criteria. Showing {totalResults} results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
              <Input
                id="search"
                placeholder="Search by property number, description..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className={cn(
                    "w-full justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-300 hover:border-slate-400 active:scale-[0.99] transition-all rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500",
                    !categoryFilter && "text-slate-400"
                  )}
                >
                  <span className="truncate">
                    {categoryFilter && categoryFilter !== 'all'
                      ? visibleCategories.find(c => c.id.toString() === categoryFilter)?.name ?? 'All Categories'
                      : 'All Categories'}
                  </span>
                  <ChevronsUpDown className={cn("ml-2 size-4 shrink-0 transition-transform duration-200 text-slate-400", categoryOpen && "text-blue-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden" align="start">
                <Command className="bg-white">
                  <div className="p-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                      <CommandInput placeholder="Search category..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                    </div>
                  </div>
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">No category found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { onCategoryFilterChange('all'); setCategoryOpen(false); }}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                          categoryFilter === 'all' && "bg-blue-50/60 font-medium text-blue-700"
                        )}
                      >
                        <span className="truncate flex-1">All Categories</span>
                        <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", categoryFilter === 'all' ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                      </CommandItem>
                      {visibleCategories.map(category => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => { onCategoryFilterChange(category.id.toString()); setCategoryOpen(false); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                            categoryFilter === category.id.toString() && "bg-blue-50/60 font-medium text-blue-700"
                          )}
                        >
                          <span className="truncate flex-1">{category.name}</span>
                          <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", categoryFilter === category.id.toString() ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Popover open={conditionOpen} onOpenChange={setConditionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={conditionOpen}
                  className={cn(
                    "w-full justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-300 hover:border-slate-400 active:scale-[0.99] transition-all rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500",
                    !conditionFilter && "text-slate-400"
                  )}
                >
                  <span className="truncate">
                    {conditionFilter && conditionFilter !== 'all'
                      ? conditionFilter
                      : 'All Conditions'}
                  </span>
                  <ChevronsUpDown className={cn("ml-2 size-4 shrink-0 transition-transform duration-200 text-slate-400", conditionOpen && "text-blue-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden" align="start">
                <Command className="bg-white">
                  <div className="p-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                      <CommandInput placeholder="Search condition..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                    </div>
                  </div>
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">No condition found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { onConditionFilterChange('all'); setConditionOpen(false); }}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                          conditionFilter === 'all' && "bg-blue-50/60 font-medium text-blue-700"
                        )}
                      >
                        <span className="truncate flex-1">All Conditions</span>
                        <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", conditionFilter === 'all' ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                      </CommandItem>
                      {conditions.map(condition => (
                        <CommandItem
                          key={condition}
                          value={condition}
                          onSelect={() => { onConditionFilterChange(condition); setConditionOpen(false); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                            conditionFilter === condition && "bg-blue-50/60 font-medium text-blue-700"
                          )}
                        >
                          <span className="truncate flex-1">{condition}</span>
                          <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", conditionFilter === condition ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Office Filter */}
          <div className="space-y-2">
            <Label htmlFor="office">Office</Label>
            <Popover open={officeOpen} onOpenChange={setOfficeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={officeOpen}
                  className={cn(
                    "w-full justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-300 hover:border-slate-400 active:scale-[0.99] transition-all rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500",
                    !officeFilter && "text-slate-400"
                  )}
                >
                  <span className="truncate">
                    {officeFilter && officeFilter !== 'all'
                      ? offices.find(o => o.id.toString() === officeFilter)?.name ?? 'All Offices'
                      : 'All Offices'}
                  </span>
                  <ChevronsUpDown className={cn("ml-2 size-4 shrink-0 transition-transform duration-200 text-slate-400", officeOpen && "text-blue-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden" align="start">
                <Command className="bg-white">
                  <div className="p-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                      <CommandInput placeholder="Search office..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                    </div>
                  </div>
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">No office found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { onOfficeFilterChange('all'); setOfficeOpen(false); }}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                          officeFilter === 'all' && "bg-blue-50/60 font-medium text-blue-700"
                        )}
                      >
                        <span className="truncate flex-1">All Offices</span>
                        <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", officeFilter === 'all' ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                      </CommandItem>
                      {offices.map(office => (
                        <CommandItem
                          key={office.id}
                          value={office.name}
                          onSelect={() => { onOfficeFilterChange(office.id.toString()); setOfficeOpen(false); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                            officeFilter === office.id.toString() && "bg-blue-50/60 font-medium text-blue-700"
                          )}
                        >
                          <span className="truncate flex-1">{office.name}</span>
                          <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", officeFilter === office.id.toString() ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Division Filter */}
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Popover open={divisionOpen} onOpenChange={setDivisionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={divisionOpen}
                  className={cn(
                    "w-full justify-between font-normal h-10 px-3 bg-white hover:bg-slate-50/80 border-slate-300 hover:border-slate-400 active:scale-[0.99] transition-all rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500",
                    !divisionFilter && "text-slate-400"
                  )}
                >
                  <span className="truncate">
                    {divisionFilter && divisionFilter !== 'all'
                      ? divisions.find(d => d.id.toString() === divisionFilter)?.name ?? 'All Divisions'
                      : 'All Divisions'}
                  </span>
                  <ChevronsUpDown className={cn("ml-2 size-4 shrink-0 transition-transform duration-200 text-slate-400", divisionOpen && "text-blue-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden" align="start">
                <Command className="bg-white">
                  <div className="p-2 bg-slate-50/50 border-b border-slate-100">
                    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden [&_[cmdk-input-wrapper]]:border-none">
                      <CommandInput placeholder="Search division..." className="h-9 text-sm placeholder:text-slate-400 focus-visible:ring-0 focus-visible:outline-none border-none shadow-none" />
                    </div>
                  </div>
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    <CommandEmpty className="py-6 text-center text-sm text-slate-500">No division found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { onDivisionFilterChange('all'); setDivisionOpen(false); }}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                          divisionFilter === 'all' && "bg-blue-50/60 font-medium text-blue-700"
                        )}
                      >
                        <span className="truncate flex-1">All Divisions</span>
                        <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", divisionFilter === 'all' ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                      </CommandItem>
                      {divisions.map(division => (
                        <CommandItem
                          key={division.id}
                          value={division.name}
                          onSelect={() => { onDivisionFilterChange(division.id.toString()); setDivisionOpen(false); }}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2.5 my-0.5 text-sm cursor-pointer transition-all duration-150 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 text-slate-700 hover:bg-slate-50",
                            divisionFilter === division.id.toString() && "bg-blue-50/60 font-medium text-blue-700"
                          )}
                        >
                          <span className="truncate flex-1">{division.name}</span>
                          <Check className={cn("ml-2 size-4 shrink-0 transition-all duration-200", divisionFilter === division.id.toString() ? "opacity-100 scale-100 text-blue-600" : "opacity-0 scale-75")} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <Label>Employee</Label>
            <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeePopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {employeeFilter && employeeFilter !== 'all'
                      ? employees.find(e => e.id.toString() === employeeFilter)?.label ?? 'All Employees'
                      : 'All Employees'}
                  </span>
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList className="max-h-60">
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { onEmployeeFilterChange('all'); setEmployeePopoverOpen(false); }}
                      >
                        <Check className={cn('mr-2 size-4', employeeFilter === 'all' || !employeeFilter ? 'opacity-100' : 'opacity-0')} />
                        All Employees
                      </CommandItem>
                      {employees.map(emp => (
                        <CommandItem
                          key={emp.id}
                          value={emp.label}
                          onSelect={() => { onEmployeeFilterChange(emp.id.toString()); setEmployeePopoverOpen(false); }}
                        >
                          <Check className={cn('mr-2 size-4', employeeFilter === emp.id.toString() ? 'opacity-100' : 'opacity-0')} />
                          {emp.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full gap-2"
            >
              <X className="size-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
