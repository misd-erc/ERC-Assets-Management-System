import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface PPEFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  conditionFilter: string;
  onConditionFilterChange: (value: string) => void;
  divisionFilter: string;
  onDivisionFilterChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export function PPEFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  conditionFilter,
  onConditionFilterChange,
  divisionFilter,
  onDivisionFilterChange,
  onClearFilters,
  totalResults,
}: PPEFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search Property #, Serial #, Description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ICT Equipment">ICT Equipment</SelectItem>
              <SelectItem value="Office Equipment">Office Equipment</SelectItem>
              <SelectItem value="Motor Vehicle">Motor Vehicle</SelectItem>
              <SelectItem value="Furniture and Fixtures">Furniture and Fixtures</SelectItem>
              <SelectItem value="Communication Equipment">Communication Equipment</SelectItem>
              <SelectItem value="Technical and Scientific Equipment">Technical and Scientific Equipment</SelectItem>
              <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={onConditionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="Working">Working</SelectItem>
              <SelectItem value="Not Working">Not Working</SelectItem>
              <SelectItem value="IIRUP">IIRUP</SelectItem>
              <SelectItem value="Disposed">Disposed</SelectItem>
              <SelectItem value="Missing">Missing</SelectItem>
            </SelectContent>
          </Select>

          <Select value={divisionFilter} onValueChange={onDivisionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              <SelectItem value="Office of the Chairman and CEO">Office of the Chairman and CEO</SelectItem>
              <SelectItem value="Legal Service">Legal Service</SelectItem>
              <SelectItem value="Administrative Service">Administrative Service</SelectItem>
              <SelectItem value="Finance Service">Finance Service</SelectItem>
              <SelectItem value="Technical Service">Technical Service</SelectItem>
              <SelectItem value="Planning and Policy Service">Planning and Policy Service</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="size-4" />
            Clear Filters
          </Button>

          <div className="flex items-center text-sm text-slate-600">
            <span className="font-medium">{totalResults}</span>
            <span className="ml-1">items</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


