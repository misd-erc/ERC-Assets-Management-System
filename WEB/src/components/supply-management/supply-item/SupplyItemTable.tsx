// src/components/supply-management/supply-item/SupplyItemTable.tsx
import { useState } from 'react';
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
  Edit, Trash2, MoreHorizontal, Plus, AlertTriangle, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SupplyItemSearchBar } from './SupplyItemSearchBar';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  data: VwSupplyItem[];
  onAdd: () => void;
  onView: (item: VwSupplyItem) => void;
  onEdit: (item: VwSupplyItem) => void;
  onDelete: (item: VwSupplyItem) => void;
  hideAddButton?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyItemTable = ({ data, onAdd, onView, onEdit, onDelete, hideAddButton = false }: Props) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStockStatus = (item: VwSupplyItem) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.currentStock <= item.reorderPoint) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Available', color: 'bg-green-100 text-green-800' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>Manage supply items with stock monitoring</CardDescription>
          </div>
          {!hideAddButton && (
            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}

        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <SupplyItemSearchBar />
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Reorder Point</TableHead>   {/* New column */}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.code}
                      {item.iarId && (
                        <span className="font-normal text-xs tracking-tight"> (IAR-{item.iarId})</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell>{item.measurementUnit?.name}</TableCell>
                    <TableCell>{item.category?.name}</TableCell>
                    <TableCell>{item.storageLocation?.name}</TableCell>
                    <TableCell>{item.vendor?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{item.quantity ?? 0} {item.measurementUnit?.name}</span>
                        {item.currentStock <= item.reorderPoint && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell>{item.reorderPoint}</TableCell>   {/* New cell */}
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(item)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          {!item.iarId && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">  {/* Updated colSpan */}
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm">Page {page} of {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};