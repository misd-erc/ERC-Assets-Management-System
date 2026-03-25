// src/components/supply-management/ris/SupplyRISTable.tsx
import { useState } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/utils/dateUtils';

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
  loading,
}: Props) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading && data.length === 0) {
    return <p className="text-center text-gray-500 py-12">Loading RIS...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Requisition and Issue Slips</CardTitle>
            <CardDescription>Manage supply requisitions and issues</CardDescription>
          </div>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Create RIS
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RIS Number</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Fund Cluster</TableHead>
                <TableHead>Office/Division</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((ris) => (
                <TableRow key={ris.id}>
                  <TableCell className="font-medium text-blue-600">{ris.risNumber}</TableCell>
                  <TableCell>{ris.entityName}</TableCell>
                  <TableCell>{ris.fundCluster}</TableCell>
                  <TableCell>
                    {ris.office?.acronym} / {ris.division?.acronym}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{ris.risPurpose}</TableCell>
                  <TableCell>{formatDate(ris.risRequestedDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ris.risApprovedDate ? 'default' : 'secondary'
                      }
                      className={
                        ris.risApprovedDate
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {ris.risApprovedDate ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(ris)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        {!ris.risApprovedDate && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(ris)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(ris)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No RIS found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};