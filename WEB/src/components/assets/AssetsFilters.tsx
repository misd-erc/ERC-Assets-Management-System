import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
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
  onClearFilters,
  totalResults,
}: AssetsFiltersProps) {
  const getSearchPlaceholder = () => {
    return type === 'ppe'
      ? "Search Property #, Serial #, Description..."
      : "Search SE Property #, Serial #, Description...";
  };

  const getCategoryOptions = () => {
    if (type === 'ppe') {
      return [
        { value: 'ICT Equipment', label: 'ICT Equipment' },
        { value: 'Office Equipment', label: 'Office Equipment' },
        { value: 'Motor Vehicle', label: 'Motor Vehicle' },
        { value: 'Furniture and Fixtures', label: 'Furniture and Fixtures' },
        { value: 'Communication Equipment', label: 'Communication Equipment' },
        { value: 'Technical and Scientific Equipment', label: 'Technical and Scientific Equipment' },
        { value: 'Sports Equipment', label: 'Sports Equipment' }
      ];
    } else {
      return [
        { value: 'ICT Equipment', label: 'ICT Equipment' },
        { value: 'Office Equipment', label: 'Office Equipment' },
        { value: 'Motor Vehicle', label: 'Motor Vehicle' },
        { value: 'Furniture and Fixtures', label: 'Furniture and Fixtures' },
        { value: 'Communication Equipment', label: 'Communication Equipment' },
        { value: 'Technical and Scientific Equipment', label: 'Technical and Scientific Equipment' },
        { value: 'Sports Equipment', label: 'Sports Equipment' }
      ];
    }
  };

  const getConditionOptions = () => {
    if (type === 'ppe') {
      return [
        { value: 'Working', label: 'Working' },
        { value: 'Not Working', label: 'Not Working' },
        { value: 'IIRUP', label: 'IIRUP' },
        { value: 'Disposed', label: 'Disposed' },
        { value: 'Missing', label: 'Missing' }
      ];
    } else {
      return [
        { value: 'Working', label: 'Working' },
        { value: 'Not Working', label: 'Not Working' },
        { value: 'Unserviceable', label: 'Unserviceable' }
      ];
    }
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

  const getDivisionOptions = () => {
    return [
      { value: 'Office of the Chairman and CEO', label: 'Office of the Chairman and CEO' },
      { value: 'Legal Service', label: 'Legal Service' },
      { value: 'Administrative Service', label: 'Administrative Service' },
      { value: 'Finance Service', label: 'Finance Service' },
      { value: 'Technical Service', label: 'Technical Service' },
      { value: 'Planning and Policy Service', label: 'Planning and Policy Service' }
    ];
  };

  const getGridCols = () => {
    if (type === 'ppe') {
      return 'grid-cols-1 md:grid-cols-6';
    } else {
      return 'grid-cols-1 md:grid-cols-7';
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`grid ${getGridCols()} gap-4`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder={getSearchPlaceholder()}
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
              {getCategoryOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={onConditionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {getConditionOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {type === 'se' && (
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
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

          <Select value={divisionFilter} onValueChange={onDivisionFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {getDivisionOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
