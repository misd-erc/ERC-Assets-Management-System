import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { getDivisions } from '@/api/office-management/divisionApi';
import { getOffices } from '@/api/office-management/officeApi';
import { getCategories, getConditions } from '@/api/inventoryApi';
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
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
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
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  totalResults,
}: AssetsFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [divisions, setDivisions] = useState<VwDivision[]>([]);

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
    loadFilters();
  }, []);



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
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter ?? undefined} onValueChange={onCategoryFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={conditionFilter ?? undefined} onValueChange={onConditionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Office Filter */}
          <div className="space-y-2">
            <Label htmlFor="office">Office</Label>
            <Select value={officeFilter ?? undefined} onValueChange={onOfficeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Offices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offices</SelectItem>
                {offices.map(office => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Division Filter */}
          <div className="space-y-2">
            <Label htmlFor="division">Division</Label>
            <Select value={divisionFilter} onValueChange={onDivisionFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {divisions.map(division => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
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
