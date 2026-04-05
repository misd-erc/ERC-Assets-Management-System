import { useState, useEffect, useMemo } from 'react';
import { SupplyUnit } from '@/types';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Edit, Trash2, MoreHorizontal, Plus, Ruler, ChevronLeft, ChevronRight, Package, SearchX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SupplyItemSearchBar } from '../supply-item/SupplyItemSearchBar'; // Adjust path if needed

interface Props {
  data: SupplyUnit[];
  usageCounts: Record<number, number>;
  onAdd: () => void;
  onEdit: (unit: SupplyUnit) => void;
  onDelete: (unit: SupplyUnit) => void;
  onViewLinkedItems: (unit: SupplyUnit) => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyUnitTable = ({
                                  data,
                                  usageCounts,
                                  onAdd,
                                  onEdit,
                                  onDelete,
                                  onViewLinkedItems,
                                  loading = false
                                }: Props) => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset to page 1 whenever the user types a new search
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // PERFORMANCE: Memoize the filter logic
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = String(searchQuery).toLowerCase().trim();
    return data.filter((unit) =>
        String(unit.name || '').toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // PERFORMANCE: Memoize pagination math
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    return filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredData, page]);

  return (
      <Card className="border-slate-200 shadow-sm">
        {/* UX ENHANCEMENT: Unified Header Toolbar */}
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-600" /> Measurement Units
              </CardTitle>
              <CardDescription>Manage units of measurement (e.g., Piece, Box, Liters)</CardDescription>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-full md:w-64">
                <SupplyItemSearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Add Unit
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="min-w-[200px]">Unit Name</TableHead>
                  <TableHead className="text-center w-[150px]">Linked Items</TableHead>
                  <TableHead className="text-center w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* SKELETON LOADER */}
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 4 }).map((_, colIndex) => (
                              <TableCell key={`skel-col-${colIndex}`}>
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                              </TableCell>
                          ))}
                        </TableRow>
                    ))
                ) : paginatedData.length > 0 ? (
                    // NORMAL DATA RENDERING
                    paginatedData.map((unit) => {
                      const itemCount = usageCounts[unit.id] || 0;
                      const isActive = unit.isActive;

                      return (
                          <TableRow key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                              <span className="font-medium text-slate-900">{unit.name}</span>
                            </TableCell>

                            <TableCell className="text-center">
                              {itemCount > 0 ? (
                                  <Button
                                      variant="ghost"
                                      className="h-auto p-0 hover:bg-transparent group"
                                      onClick={() => onViewLinkedItems(unit)}
                                  >
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors cursor-pointer flex items-center gap-1.5">
                                      <Package className="w-3 h-3" />
                                      {itemCount} Items
                                    </Badge>
                                  </Button>
                              ) : (
                                  <span className="text-slate-400 text-sm font-medium px-4">-</span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                  variant="outline"
                                  className={`whitespace-nowrap ${
                                      isActive
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}
                              >
                                {isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                                    <MoreHorizontal className="w-4 h-4"/>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => onEdit(unit)} className="cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2 text-blue-500"/> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                      onClick={() => onDelete(unit)}
                                      disabled={itemCount > 0}
                                      className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2"/> Delete
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
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                          <div className="p-3 bg-slate-50 rounded-full">
                            <SearchX className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-900">No units found</p>
                          <p className="text-sm">
                            {searchQuery ? "Try adjusting your search criteria." : "Get started by adding a new measurement unit."}
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
                  Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, filteredData.length)}</span> of <span className="font-medium text-slate-900">{filteredData.length}</span> units
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
  );
};