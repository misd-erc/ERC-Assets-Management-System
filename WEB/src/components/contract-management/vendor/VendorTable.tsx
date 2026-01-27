// src/components/office/DivisionTable.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Vendor } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DivisionSearchBar } from '@/components/office-management/division/DivisionSearchBar';
import { useState, useEffect } from 'react';
import { useVendor } from '@/hooks';   // <-- NEW (same path as Office)

interface Props {
  data: Vendor[];
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: number, name: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                               */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-gray-100 text-gray-800';
    case 'Suspended':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export const VendorTable = ({ data, onAdd, onEdit, onDelete }: Props) => {
  const { searchQuery } = useVendor();       // <-- read current search
  const [page, setPage] = useState(1);

  /* Reset to page 1 whenever the search term changes */
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  /* Pagination logic */
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vendors ({data.length})</CardTitle>
            <CardDescription>
              Manage vendors records and their status
            </CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </CardHeader>

      {/* Search bar â€“ uses useDivision() internally */}
      <DivisionSearchBar />

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map(vendor => (
                <TableRow key={vendor.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {vendor.id}
                  </TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(
                        vendor.isActive ? 'Active' : 'Inactive'
                      )}
                    >
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(vendor.createdAt!).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(vendor)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(vendor.id, vendor.name)}
                          className="text-red-600"
                          // disabled={vendor.users.length > 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vendors found
            </div>
          )}
        </div>

        {/* ---------- Pagination UI ---------- */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, data.length)} of {data.length}{' '}
              entries
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="px-3 text-sm">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};






