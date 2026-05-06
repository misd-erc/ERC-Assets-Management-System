import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Edit, Trash2, MoreHorizontal, Eye, PackageOpen, UploadCloud, 
  Search, Filter, ChevronLeft, ChevronRight, PackageSearch 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';

interface Props {
  data: VwDeliveryRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: string;
  loading?: boolean;
  onAdd: () => void;
  onEdit: (record: VwDeliveryRecord) => void;
  onDelete: (record: VwDeliveryRecord) => void;
  onView: (record: VwDeliveryRecord) => void;
  onUploadProof: (record: VwDeliveryRecord) => void;
  onParamsChange: (params: { page?: number; search?: string; status?: string }) => void;
}

export const DeliveryRecordTable = ({ 
  data, 
  totalCount,
  page,
  pageSize,
  searchQuery,
  statusFilter,
  loading = false,
  onAdd, 
  onEdit, 
  onDelete, 
  onView, 
  onUploadProof,
  onParamsChange
}: Props) => {
  const getTotalValue = (record: VwDeliveryRecord) => {
    if (record.totalAmount && record.totalAmount > 0) return record.totalAmount;
    return (record.items || []).reduce((sum, item) => sum + (item.itemQuantity * item.unitCost), 0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-900">Delivery Records</CardTitle>
                <CardDescription>Manage incoming deliveries and receipts</CardDescription>
              </div>
              <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                Record Delivery
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Search DR#, IAR#, PO#, or Entity..."
                    value={searchQuery}
                    onChange={(e) => onParamsChange({ search: e.target.value, page: 1 })}
                    className="pl-9 bg-white"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={statusFilter} onValueChange={(val) => onParamsChange({ status: val, page: 1 })}>
                    <SelectTrigger className="w-[140px] bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(searchQuery || statusFilter !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onParamsChange({ search: "", status: "all", page: 1 })}
                        className="text-slate-500 hover:text-slate-900 h-9"
                    >
                      Reset
                    </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-semibold">DR Number</TableHead>
                  <TableHead className="font-semibold">Delivery Date</TableHead>
                  <TableHead className="font-semibold">Total Value</TableHead>
                  <TableHead className="font-semibold">Employee</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}><div className="h-10 w-full bg-slate-100 animate-pulse rounded" /></TableCell>
                        </TableRow>
                    ))
                ) : data.length > 0 ? (
                    data.map((record) => (
                        <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-medium text-blue-600">
                            {record.drNumber}
                            {record.supplyIAR && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  IAR: {record.supplyIAR.iarNumber}
                                </div>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">{formatDate(record.deliveryDate)}</TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            {formatCurrency(getTotalValue(record))}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={record.isReceived ? "default" : "secondary"}
                                   className={record.isReceived ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                            >
                              {record.isReceived ? 'Received' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onView(record)} className="cursor-pointer">
                                  <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                                </DropdownMenuItem>

                                {!record.fileId && (
                                    <DropdownMenuItem onClick={() => onUploadProof(record)} className="cursor-pointer">
                                      <UploadCloud className="w-4 h-4 mr-2 text-blue-500" /> Upload Proof
                                    </DropdownMenuItem>
                                )}

                                {!record.isReceived && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onEdit(record)} className="cursor-pointer">
                                        <Edit className="w-4 h-4 mr-2 text-amber-500" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700">
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                      </DropdownMenuItem>
                                    </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-60 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                          <div className="p-4 bg-slate-50 rounded-full">
                            <PackageSearch className="h-10 w-10 text-slate-300" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">No delivery records found</p>
                            <p className="text-sm">
                              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start by recording a new delivery'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                            Add New Delivery
                          </Button>
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
                  Showing <span className="font-medium text-slate-900">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onParamsChange({ page: Math.max(1, page - 1) })} 
                    disabled={page === 1} 
                    className="shadow-sm bg-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onParamsChange({ page: Math.min(totalPages, page + 1) })} 
                    disabled={page === totalPages} 
                    className="shadow-sm bg-white"
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