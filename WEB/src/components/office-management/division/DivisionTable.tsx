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
import { Division, Office, VwDivision } from '@/types';
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
// import { DivisionTabsList } from '@/components/office-management/division/DivisionTabsList';
import { useState, useEffect } from 'react';
import { useDivision } from '@/hooks';   // <-- NEW (same path as Office)

interface Props {
  data: VwDivision[];
  onAdd: () => void;
  onEdit: (vwDivision: VwDivision) => void;
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
export const DivisionTable = ({ data, onAdd, onEdit, onDelete }: Props) => {
  const { searchQuery } = useDivision();       // <-- read current search
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
            <CardTitle>Divisions ({data.length})</CardTitle>
            <CardDescription>
              Manage division records and their status
            </CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Division
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
                <TableHead>Office</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map(division => (
                <TableRow key={division.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {division.acronym}
                  </TableCell>
                  <TableCell>{division.name}</TableCell>
                  <TableCell>{division.office?.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(
                        division.isActive ? 'Active' : 'Inactive'
                      )}
                    >
                      {division.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{division.users.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(division.createdAt!).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(division)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(division.id, division.name)}
                          className="text-red-600"
                          disabled={division.users.length > 0}
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
              No divisions found
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






