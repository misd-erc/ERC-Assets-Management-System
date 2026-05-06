import { useState, useEffect, useMemo } from 'react';
import { VwSupplyRIS } from '@/types/supply/ris';
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
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  SearchX,
  CheckCircle,
  ArrowUpDown,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VwOffice, VwDivision } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { formatDate } from '@/utils/dateUtils';
import { SupplyItemSearchBar } from '../supply-item/SupplyItemSearchBar'; // Adjust path if needed

interface Props {
  data: VwSupplyRIS[];
  totalCount: number;
  page: number;
  searchQuery: string;
  statusFilter: string;
  officeFilter: string;
  divisionFilter: string;
  startDate?: string;
  endDate?: string;
  offices?: VwOffice[];
  divisions?: VwDivision[];
  onAdd: () => void;
  onEdit: (ris: VwSupplyRIS) => void;
  onView: (ris: VwSupplyRIS) => void;
  onDelete: (ris: VwSupplyRIS) => void;
  onApprove: (ris: VwSupplyRIS) => void;
  onParamsChange: (params: { 
    page: number; 
    search: string; 
    status: string;
    officeId?: string;
    divisionId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyRISTable = ({
                                 data,
                                 totalCount,
                                 page,
                                 searchQuery,
                                 statusFilter,
                                 officeFilter,
                                 divisionFilter,
                                 startDate,
                                 endDate,
                                 offices = [],
                                 divisions = [],
                                 onAdd,
                                 onEdit,
                                 onView,
                                 onDelete,
                                 onApprove,
                                 onParamsChange,
                                 loading = false,
                               }: Props) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const updateParams = (updates: Partial<{ 
    page: number; 
    search: string; 
    status: string;
    officeId: string;
    divisionId: string;
    startDate: string;
    endDate: string;
  }>) => {
    onParamsChange({
      page: updates.page ?? page,
      search: updates.search ?? searchQuery,
      status: updates.status ?? statusFilter,
      officeId: updates.officeId ?? officeFilter,
      divisionId: updates.divisionId ?? divisionFilter,
      startDate: updates.startDate ?? startDate,
      endDate: updates.endDate ?? endDate,
    });
  };

  return (
      <Card className="border-slate-200 shadow-sm">
        {/* UX ENHANCEMENT: Unified Header Toolbar */}
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Requisition & Issue Slips
                </CardTitle>
                <CardDescription>Manage supply requisitions, approvals, and issuance</CardDescription>
              </div>

              <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Create RIS
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <div className="w-full md:flex-1">
                <SupplyItemSearchBar value={searchQuery} onChange={(val) => updateParams({ search: val, page: 1 })} />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={(val) => updateParams({ status: val, page: 1 })}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Approval Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`h-9 px-3 ${showAdvanced ? 'bg-slate-100 text-slate-900 border-slate-300' : 'text-slate-600'}`}
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  {showAdvanced ? 'Simple' : 'Advanced'}
                </Button>

                {(searchQuery || statusFilter !== "all" || officeFilter !== "all" || divisionFilter !== "all" || startDate || endDate) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateParams({ 
                            search: "", 
                            status: "all", 
                            officeId: "all", 
                            divisionId: "all", 
                            startDate: "", 
                            endDate: "", 
                            page: 1 
                          });
                        }}
                        className="text-slate-500 hover:text-slate-900 h-9"
                    >
                      Reset
                    </Button>
                )}
              </div>
            </div>

            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1">Office</label>
                    <Select value={officeFilter} onValueChange={(val) => updateParams({ officeId: val, page: 1 })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="All Offices" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Offices</SelectItem>
                        {offices.map(off => (
                            <SelectItem key={off.id} value={off.id.toString()}>{off.acronym}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1">Division</label>
                    <Select value={divisionFilter} onValueChange={(val) => updateParams({ divisionId: val, page: 1 })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="All Divisions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Divisions</SelectItem>
                        {divisions.filter(d => officeFilter === 'all' || d.officeId === Number(officeFilter)).map(div => (
                            <SelectItem key={div.id} value={div.id.toString()}>{div.acronym}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> From Date
                    </label>
                    <Input 
                      type="date" 
                      value={startDate || ''} 
                      onChange={(e) => updateParams({ startDate: e.target.value, page: 1 })}
                      className="bg-white h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 ml-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> To Date
                    </label>
                    <Input 
                      type="date" 
                      value={endDate || ''} 
                      onChange={(e) => updateParams({ endDate: e.target.value, page: 1 })}
                      className="bg-white h-9"
                    />
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
                  <TableHead className="w-[150px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('risRequestedDate')}>
                    <div className="flex items-center gap-1">
                      Requested Date <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px] cursor-pointer hover:text-blue-600" onClick={() => handleSort('risNumber')}>
                    <div className="flex items-center gap-1">
                      RIS Number <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('office')}>
                    <div className="flex items-center gap-1">
                      Office / Division <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:text-blue-600" onClick={() => handleSort('requestedBySystemUser')}>
                    <div className="flex items-center gap-1">
                      Requested By <ArrowUpDown className="w-3 h-3" />
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
                    data.map((ris) => {
                      const isApproved = ris.isApproved;
                      const statusLabel = isApproved ? 'Approved' : 'Pending';
                      const statusClasses = isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';

                      return (
                          <TableRow key={ris.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-slate-600">
                              {formatDate(ris.risRequestedDate)}
                            </TableCell>

                            <TableCell>
                              <span className="font-semibold text-slate-900">{ris.risNumber}</span>
                            </TableCell>

                            <TableCell>
                              <div className="font-medium text-slate-700">
                                {ris.office?.acronym || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {ris.division?.acronym || 'No Division'}
                              </div>
                            </TableCell>

                            <TableCell className="text-slate-700 font-medium">
                              {ris.requestedBySystemUser?.firstName} {ris.requestedBySystemUser?.lastName}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge variant="outline" className={`${statusClasses} whitespace-nowrap`}>
                                {statusLabel}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {!isApproved && (
                                      <DropdownMenuItem onClick={() => onApprove(ris)} className="cursor-pointer">
                                        <CheckCircle className={`w-4 h-4 mr-2 ${isApproved ? 'text-amber-500' : 'text-emerald-500'}`} />
                                        Approve RIS
                                      </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem onClick={() => onView(ris)} className="cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                                  </DropdownMenuItem>
                                  {!isApproved && (
                                      <>
                                        <DropdownMenuItem onClick={() => onEdit(ris)} className="cursor-pointer">
                                          <Edit className="w-4 h-4 mr-2 text-blue-500" /> Edit RIS
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(ris)}
                                            className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" /> Delete RIS
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
                    // POLISHED EMPTY STATE
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                          <div className="p-3 bg-slate-50 rounded-full">
                            <SearchX className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-900">No Requisition Slips found</p>
                          <p className="text-sm">
                            {searchQuery ? "Try adjusting your search criteria." : "Get started by creating a new RIS."}
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
                  Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                      disabled={page === 1}
                      className="shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
                      disabled={page === totalPages}
                      className="shadow-sm"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
};