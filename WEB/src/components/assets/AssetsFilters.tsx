import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Funnel, ChevronDown, ChevronUp } from 'lucide-react';
import { AssetType } from '@/services/assetService';

interface AssetsFiltersProps {
  type: AssetType;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  conditionFilter: string;
  onConditionFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
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
  type,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  conditionFilter,
  onConditionFilterChange,
  statusFilter,
  onStatusFilterChange,
  divisionFilter,
  onDivisionFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  totalResults,
}: AssetsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const getSearchPlaceholder = () => {
    return type === 'ppe'
      ? "Search Property #, Serial #, Description..."
      : "Search SE Property #, Serial #, Description...";
  };

  const getStatusOptions = () => {
    if (type === 'se') {
      return [
        { value: 'Active', label: 'Active' },
        { value: 'Returned', label: 'Returned' },
        { value: 'Lost', label: 'Lost' },
        { value: 'Unserviceable', label: 'Unserviceable' }
      ];
    }
    return [];
  };



  return (
    <div className="space-y-4">
      {/* Search bar with filter button */}
      <div className="flex justify-center items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Funnel className="size-4" />
          Filters
          {showFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Filter selects in rows */}
              <div className="space-y-3">
                <div className="flex justify-center gap-3 flex-wrap">
                  {type === 'se' && (
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {getStatusOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Date filters */}
                <div className="flex justify-center gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>



                {/* Additional filters */}
                <div className="flex justify-center gap-3 flex-wrap">
                  <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {/* Add category options here */}
                    </SelectContent>
                  </Select>
                  <Select value={conditionFilter} onValueChange={onConditionFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      {/* Add condition options here */}
                    </SelectContent>
                  </Select>
                  <Select value={divisionFilter} onValueChange={onDivisionFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      {/* Add division options here */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions and results */}
              <div className="flex justify-center items-center gap-4 pt-2">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
