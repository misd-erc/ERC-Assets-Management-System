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
  Edit, Trash2, MoreHorizontal, Plus, AlertTriangle, ChevronLeft, ChevronRight, Eye, PackageSearch, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SupplyItemSearchBar } from './SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  data: VwSupplyItem[];
  isLoading?: boolean;
  onAdd: () => void;
  onView: (item: VwSupplyItem) => void;
  onEdit: (item: VwSupplyItem) => void;
  onDelete: (item: VwSupplyItem) => void;
  hideAddButton?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyItemTable = ({ data, isLoading = false, onAdd, onView, onEdit, onDelete, hideAddButton = false }: Props) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = String(searchQuery).toLowerCase().trim();
    return data.filter((item) => {
      const codeStr = String(item.code || '').toLowerCase();
      const descStr = String(item.description || '').toLowerCase();
      return codeStr.includes(query) || descStr.includes(query);
    });
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    return filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredData, page]);

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
          {/* Header content stays exactly the same */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-900">Inventory Items</CardTitle>
              <CardDescription>Manage supply items with stock monitoring</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-full md:w-64">
                <SupplyItemSearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              {!hideAddButton && (
                  <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={isLoading}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                {/* Table Headers stay exactly the same */}
                <TableRow>
                  <TableHead className="w-[150px]">Item Code</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Reorder Pt.</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* INTERCEPT RENDERING IF LOADING */}
                {isLoading ? (
                    // Render 5 Skeleton Rows while fetching
                    Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 10 }).map((_, colIndex) => (
                              <TableCell key={`skel-col-${colIndex}`}>
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                              </TableCell>
                          ))}
                        </TableRow>
                    ))
                ) : paginatedData.length > 0 ? (
                    paginatedData.map((item) => {
                      const status = getStockStatus(item);
                      const isLowStock = item.currentStock > 0 && item.currentStock <= item.reorderPoint;

                      return (
                          <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Your existing row cells go here (Item Code, Description, etc.) */}
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
                            <TableCell className="text-slate-600 max-w-[150px] truncate" title={item.vendor?.name}>{item.vendor?.name}</TableCell>
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

          {/* Hide Pagination while loading or if no pages */}
          {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                {/* ... Your pagination buttons ... */}
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, filteredData.length)}</span> of <span className="font-medium text-slate-900">{filteredData.length}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="shadow-sm">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="shadow-sm">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
};