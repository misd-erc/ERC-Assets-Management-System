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
import { MoreHorizontal, Eye, ChevronLeft, ChevronRight, Plus, PackageSearch, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SupplyItemSearchBar } from '../SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

import { SupplyUnitEditModal } from '../../supply-unit/SupplyUnitEditModal';
import { SupplyStorageEditModal } from '../../supply-storage/SupplyStorageEditModal';

interface Props {
  data: VwSupplyGroupedItem[];
  onView: (item: VwSupplyGroupedItem) => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyGroupedItemTable = ({ data, onView, loading = false }: Props) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // PERFORMANCE: Memoize the filter logic
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = String(searchQuery).toLowerCase().trim();
    return data.filter((item) => {
      const codeStr = String(item.code || '').toLowerCase();
      const descStr = String(item.description || '').toLowerCase();
      return codeStr.includes(query) || descStr.includes(query);
    });
  }, [data, searchQuery]);

  // PERFORMANCE: Memoize pagination math
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    return filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredData, page]);

  return (
      <>
        <Card className="border-slate-200 shadow-sm">
          {/* UX ENHANCEMENT: Unified Header Toolbar */}
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" /> Grouped Inventory
                </CardTitle>
                <CardDescription>Overview of supply items grouped by item code</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="w-full sm:w-64">
                  <SupplyItemSearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                      variant="outline"
                      className="flex-1 sm:flex-none border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                      onClick={() => setIsUnitModalOpen(true)}
                      disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Unit
                  </Button>
                  <Button
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 shadow-sm"
                      onClick={() => setIsStorageModalOpen(true)}
                      disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Location
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-[150px]">Item Code</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    <TableHead className="text-right">Total Stock</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
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
                  ) : paginatedData.length > 0 ? (
                      // NORMAL DATA RENDERING
                      paginatedData.map((item) => {
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
                    Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, filteredData.length)}</span> of <span className="font-medium text-slate-900">{filteredData.length}</span> groups
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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