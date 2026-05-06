import { useState, useEffect, useMemo } from 'react';
import { VwSupplyGroupedItem } from '@/types';
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
import { MoreHorizontal, Eye, ChevronLeft, ChevronRight, Plus, PackageSearch, Layers, ArrowUpDown, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SupplyItemSearchBar } from '../SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

import { SupplyUnitEditModal } from '../../supply-unit/SupplyUnitEditModal';
import { SupplyStorageEditModal } from '../../supply-storage/SupplyStorageEditModal';

interface Props {
  data: VwSupplyGroupedItem[];
  totalCount: number;
  page: number;
  searchQuery: string;
  statusFilter: string;
  categoryFilter?: string;
  storageFilter?: string;
  vendorFilter?: string;
  allCategories?: any[];
  storageLocations?: any[];
  allVendors?: any[];
  loading?: boolean;
  onView: (item: VwSupplyGroupedItem) => void;
  onParamsChange: (params: { page: number; search: string; status: string; category?: string; storageId?: string; vendorId?: string }) => void;
}

const PAGE_SIZE = 10;

export const SupplyGroupedItemTable = ({ 
  data, 
  totalCount,
  page,
  searchQuery,
  statusFilter,
  categoryFilter = "all",
  storageFilter = "all",
  vendorFilter = "all",
  allCategories = [],
  storageLocations = [],
  allVendors = [],
  onView, 
  onParamsChange,
  loading = false 
}: Props) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const updateParams = (updates: Partial<{ page: number; search: string; status: string; category: string; storageId: string; vendorId: string }>) => {
    onParamsChange(updates);
  };

  return (
      <>
        <Card className="border-slate-200 shadow-sm">
          {/* UX ENHANCEMENT: Unified Header Toolbar */}
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" /> Grouped Inventory
                  </CardTitle>
                  <CardDescription>Overview of supply items grouped by item code</CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                      onClick={() => setIsUnitModalOpen(true)}
                      disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Unit
                  </Button>
                  <Button
                      className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                      onClick={() => setIsStorageModalOpen(true)}
                      disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Location
                  </Button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                <div className="w-full md:flex-1">
                  <SupplyItemSearchBar value={searchQuery} onChange={(val) => updateParams({ search: val, page: 1 })} />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={statusFilter} onValueChange={(val) => updateParams({ status: val, page: 1 })}>
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
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

                  {(searchQuery || statusFilter !== "all" || categoryFilter !== "all" || storageFilter !== "all" || vendorFilter !== "all") && (
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateParams({ search: "", status: "all", category: "all", storageId: "all", vendorId: "all", page: 1 });
                          }}
                          className="text-slate-500 hover:text-slate-900 h-9"
                      >
                        Reset
                      </Button>
                  )}
                </div>
              </div>

              {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 ml-1">Category</label>
                      <Select value={categoryFilter} onValueChange={(val) => updateParams({ category: val, page: 1 })}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {allCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 ml-1">Storage Location</label>
                      <Select value={storageFilter} onValueChange={(val) => updateParams({ storageId: val, page: 1 })}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {storageLocations.map(loc => (
                              <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 ml-1">Vendor</label>
                      <Select value={vendorFilter} onValueChange={(val) => updateParams({ vendorId: val, page: 1 })}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="All Vendors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vendors</SelectItem>
                          {allVendors.map(v => (
                              <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[150px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('code')}>
                      <div className="flex items-center gap-1">
                        Item Code <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[250px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-1">
                        Description <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('totalCurrentStock')}>
                      <div className="flex items-center justify-end gap-1">
                        Total Stock <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:text-blue-600" onClick={() => handleSort('totalStockCost')}>
                      <div className="flex items-center justify-end gap-1">
                        Total Cost <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* SKELETON LOADER */}
                  {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`skeleton-${index}`}>
                            {Array.from({ length: 6 }).map((_, colIndex) => (
                                <TableCell key={`skel-col-${colIndex}`}>
                                  <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                                </TableCell>
                            ))}
                          </TableRow>
                      ))
                  ) : data.length > 0 ? (
                      // NORMAL DATA RENDERING
                      data.map((item) => {
                        const status =
                            item.totalCurrentStock === 0
                                ? { label: 'Out of Stock', classes: 'bg-red-50 text-red-700 border-red-200' }
                                : { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

                        return (
                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell>
                                <div className="font-medium text-slate-900">{item.code}</div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[350px] truncate font-medium text-slate-700" title={item.description}>
                                  {item.description}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                          <span className={item.totalCurrentStock === 0 ? 'text-red-600 font-medium' : 'text-slate-900 font-medium'}>
                            {item.totalCurrentStock}
                          </span>
                              </TableCell>
                              <TableCell className="text-right font-medium text-slate-700">
                                {formatCurrency(item.totalStockCost)}
                              </TableCell>
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
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => onView(item)} className="cursor-pointer">
                                      <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Group Details
                                    </DropdownMenuItem>
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
                              <PackageSearch className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="font-medium text-slate-900">No grouped items found</p>
                            <p className="text-sm">
                              {searchQuery ? "Try adjusting your search criteria." : "Data will appear here once items are added."}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <p className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> groups
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                        disabled={page === 1}
                        className="shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
                        disabled={page === totalPages}
                        className="shadow-sm"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        <SupplyUnitEditModal
            open={isUnitModalOpen}
            onOpenChange={setIsUnitModalOpen}
            mode="add"
            unit={null}
        />

        <SupplyStorageEditModal
            open={isStorageModalOpen}
            onOpenChange={setIsStorageModalOpen}
            mode="add"
            storage={null}
        />
      </>
  );
};