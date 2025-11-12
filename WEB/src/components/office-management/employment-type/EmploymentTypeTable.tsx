// src/components/employment-type/EmploymentTypeTable.tsx
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { EmploymentType, VwEmploymentType } from '../../../types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { EmploymentTypeSearchBar } from './EmploymentTypeSearchBar';
import { useState, useEffect } from 'react';
import { useEmploymentType } from '../../../hooks';
import { getStatusColor } from '../../../utils/colorUtils';

interface Props {
  data: VwEmploymentType[];
  onAdd: () => void;
  onEdit: (type: EmploymentType) => void;
  onDelete: (id: number, name: string) => void;
}

const PAGE_SIZE = 10;

export const EmploymentTypeTable = ({ data, onAdd, onEdit, onDelete }: Props) => {
  const { searchQuery } = useEmploymentType();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Employment Types ({data.length})</CardTitle>
            <CardDescription>Manage employment type records</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>

      <EmploymentTypeSearchBar />

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map(type => (
                <TableRow key={type.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(type.isActive ? 'Active' : 'Inactive')}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{type.users.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(type.createdAt!).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(type)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(type.id, type.name)}
                          className="text-red-600"
                          disabled={type.users.length > 0}
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
              No employment types found
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, data.length)} of {data.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={goNext} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};