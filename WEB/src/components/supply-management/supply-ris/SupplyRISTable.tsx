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
  SearchX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/utils/dateUtils';
import { SupplyItemSearchBar } from '../supply-item/SupplyItemSearchBar'; // Adjust path if needed

interface Props {
  data: VwSupplyRIS[];
  onAdd: () => void;
  onEdit: (ris: VwSupplyRIS) => void;
  onView: (ris: VwSupplyRIS) => void;
  onDelete: (ris: VwSupplyRIS) => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const SupplyRISTable = ({
                                 data,
                                 onAdd,
                                 onEdit,
                                 onView,
                                 onDelete,
                                 loading = false,
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
    return data.filter((ris) => {
      const risNum = String(ris.risNumber || '').toLowerCase();
      const office = String(ris.office?.acronym || '').toLowerCase();
      const division = String(ris.division?.acronym || '').toLowerCase();
      const requesterName = String(`${ris.requestedBySystemUser?.firstName || ''} ${ris.requestedBySystemUser?.lastName || ''}`).toLowerCase();

      return risNum.includes(query) ||
          office.includes(query) ||
          division.includes(query) ||
          requesterName.includes(query);
    });
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
                <FileText className="w-5 h-5 text-blue-600" /> Requisition & Issue Slips
              </CardTitle>
              <CardDescription>Manage supply requisitions, approvals, and issuance</CardDescription>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-full md:w-64">
                <SupplyItemSearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 shrink-0 shadow-sm" disabled={loading}>
                <Plus className="w-4 h-4 mr-2" /> Create RIS
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[150px]">Requested Date</TableHead>
                  <TableHead className="w-[180px]">RIS Number</TableHead>
                  <TableHead>Office / Division</TableHead>
                  <TableHead>Requested By</TableHead>
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
                    paginatedData.map((ris) => {
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
                  Showing <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, filteredData.length)}</span> of <span className="font-medium text-slate-900">{filteredData.length}</span> results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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