import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Edit, Trash2, MoreHorizontal, Eye, CheckCircle, FileQuestion, Package, 
  Search, Filter, ChevronLeft, ChevronRight, PackageSearch 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VwSupplyIAR } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface Props {
  data: VwSupplyIAR[];
  totalCount: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: string;
  vendorFilter?: number;
  officeFilter?: number;
  divisionFilter?: number;
  vendors?: any[];
  offices?: any[];
  divisions?: any[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (record: VwSupplyIAR) => void;
  onDelete: (record: VwSupplyIAR) => void;
  onView: (record: VwSupplyIAR) => void;
  onApprove: (record: VwSupplyIAR) => void;
  onParamsChange: (params: { page?: number; search?: string; status?: string; vendorId?: number; officeId?: number; divisionId?: number }) => void;
}

export const SupplyIARTable = ({ 
  data, 
  totalCount,
  page,
  pageSize,
  searchQuery,
  statusFilter,
  vendorFilter,
  officeFilter,
  divisionFilter,
  vendors = [],
  offices = [],
  divisions = [],
  loading = false,
  onAdd, 
  onEdit, 
  onDelete, 
  onView, 
  onApprove,
  onParamsChange
}: Props) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-slate-900">Inspection & Acceptance Reports</CardTitle>
              <CardDescription>Manage official IAR documentation</CardDescription>
            </div>
            <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
              Generate IAR
            </Button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                  placeholder="Search IAR#, DR#, PO#, or Entity..."
                  value={searchQuery}
                  onChange={(e) => onParamsChange({ search: e.target.value, page: 1 })}
                  className="pl-9 bg-white"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={(val) => onParamsChange({ status: val, page: 1 })}>
                  <SelectTrigger className="w-[130px] bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select 
                value={vendorFilter?.toString() || "all"} 
                onValueChange={(val) => onParamsChange({ vendorId: val === "all" ? undefined : Number(val), page: 1 })}
              >
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={officeFilter?.toString() || "all"} 
                onValueChange={(val) => onParamsChange({ officeId: val === "all" ? undefined : Number(val), page: 1 })}
              >
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offices</SelectItem>
                  {offices.map(o => (
                      <SelectItem key={o.id} value={o.id.toString()}>{o.acronym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchQuery || statusFilter !== "all" || vendorFilter || officeFilter) && (
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onParamsChange({ search: "", status: "all", vendorId: undefined, officeId: undefined, page: 1 })}
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
                <TableHead className="font-semibold">IAR Number</TableHead>
                <TableHead className="font-semibold">Linked DR</TableHead>
                <TableHead className="font-semibold">Vendor</TableHead>
                <TableHead className="font-semibold">Office / Div</TableHead>
                <TableHead className="font-semibold">PO Number</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}><div className="h-10 w-full bg-slate-100 animate-pulse rounded" /></TableCell>
                      </TableRow>
                  ))
              ) : data.length > 0 ? (
                data.map((record: VwSupplyIAR) => (
                  <TableRow key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-blue-600">{record.iarNumber}</TableCell>
                    <TableCell>
                      {record.drNumber ? (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-blue-700">{record.drNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-slate-700" title={record.vendor?.name}>
                      {record.vendor?.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium text-slate-900">{record.office?.acronym || 'N/A'}</p>
                        <p className="text-slate-500">{record.division?.acronym || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{record.poNumber}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={record.isApproved ? 'default' : 'secondary'}
                        className={record.isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                      >
                        {record.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!record.isApproved && (
                            <>
                              <DropdownMenuItem onClick={() => onApprove(record)} className="text-emerald-600 cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve Record
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onView(record)} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                          </DropdownMenuItem>
                          {!record.isApproved && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(record)} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2 text-amber-500" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
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
                  <TableCell colSpan={7} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <PackageSearch className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">No IAR records found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start by generating a new report'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                        Generate IAR
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