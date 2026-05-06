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
  Edit, Trash2, MoreHorizontal, Plus, AlertTriangle, ChevronLeft, ChevronRight, Eye, PackageSearch, ArrowUpDown, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { SupplyItemSearchBar } from './SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  data: VwSupplyItem[];
  totalCount: number;
  page: number;
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  storageFilter: string;
  storageLocations?: SupplyStorageLocation[];
  loading?: boolean;
  onAdd: () => void;
  onView: (item: VwSupplyItem) => void;
  onEdit: (item: VwSupplyItem) => void;
  onDelete: (item: VwSupplyItem) => void;
  onParamsChange: (params: { page: number; search: string; category: string; status: string; storageId?: string }) => void;
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
  storageLocations = [],
  loading = false, 
  onAdd, 
  onView, 
  onEdit, 
  onDelete, 
  onParamsChange,
  hideAddButton = false 
}: Props) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getStockStatusLabel = (item: VwSupplyItem) => {
    if (item.quantity == 0) return 'Out of Stock';
    if (item.quantity <= item.reorderPoint) return 'Low Stock';
    return 'Available';
  };

  // Categories are now passed or fetched separately, but we can still derive them from current page data for the dropdown
  // though it's better to fetch all categories once. For now, we'll keep the unique categories from current data.
  const categories = useMemo(() => {
    const unique = new Set(data.map(item => item.category?.name).filter(Boolean));
    return Array.from(unique).sort();
  }, [data]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    // Note: Server-side sorting can be implemented by adding 'orderBy' to onParamsChange
  };

  const updateParams = (updates: Partial<{ page: number; search: string; category: string; status: string; storageId: string }>) => {
    onParamsChange({
      page: updates.page ?? page,
      search: updates.search ?? searchQuery,
      category: updates.category ?? categoryFilter,
      status: updates.status ?? statusFilter,
      storageId: updates.storageId ?? storageFilter,
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
                      <SelectTrigger className="w-[150px] bg-white">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select value={statusFilter} onValueChange={(val) => updateParams({ status: val, page: 1 })}>
                    <SelectTrigger className="w-[150px] bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
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

                  {(searchQuery || categoryFilter !== "all" || statusFilter !== "all" || storageFilter !== "all") && (
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateParams({ search: "", category: "all", status: "all", storageId: "all", page: 1 });
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
                  {/* Additional filters can be added here */}
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
                {loading ? (
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
                ) : data.length > 0 ? (
                    // NORMAL DATA RENDERING
                    data.map((item) => {
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
                                  {!item.iarId && (
                                      <>
                                        <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                                          <Edit className="w-4 h-4 mr-2 text-blue-500" /> Edit Item
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                          <Trash2 className="w-4 h-4 mr-2" /> Delete Item
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

          {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => updateParams({ page: Math.max(1, page - 1) })} disabled={page === 1} className="shadow-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })} disabled={page === totalPages} className="shadow-sm">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
};