import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
}: AssetsFiltersProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onApplyFilters?.();
  };

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);
  const [employees, setEmployees] = useState<{ id: number; label: string }[]>([]);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesData, conditionsData, officesData, divisionsData] = await Promise.all([
          getCategories(),
          getConditions(),
          getOffices(),
          getDivisions(),
        ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setConditions(Array.isArray(conditionsData) ? conditionsData : []);
        setOffices(Array.isArray(officesData) ? officesData : []);
        setDivisions(Array.isArray(divisionsData) ? divisionsData : []);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };

    void loadFilters();
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!employeePopoverOpen || employeesLoaded || isLoadingEmployees) {
        return;
      }

      try {
        setIsLoadingEmployees(true);
        const employeesData = await getEmployees(1, 10000);
        const empItems = employeesData?.data?.items ?? [];
        setEmployees(empItems.map((e: any) => ({
          id: e.id,
          label: [e.lastName, e.firstName, e.middleName].filter(Boolean).join(', ') +
            (e.employeeIdOriginal ? ` - ${e.employeeIdOriginal}` : ''),
        })));
        setEmployeesLoaded(true);
      } catch (error) {
        console.error('Failed to load employees:', error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    void loadEmployees();
  }, [employeePopoverOpen, employeesLoaded, isLoadingEmployees]);

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

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter ?? undefined} onValueChange={onCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={conditionFilter ?? undefined} onValueChange={onConditionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="office">Office</Label>
            <Select value={officeFilter ?? undefined} onValueChange={onOfficeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Offices" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Offices</SelectItem>
                {offices.map(office => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Select value={divisionFilter} onValueChange={onDivisionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                    <CommandEmpty>{isLoadingEmployees ? 'Loading employees...' : 'No employee found.'}</CommandEmpty>
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
