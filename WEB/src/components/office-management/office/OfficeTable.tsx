// src/components/office/OfficeTable.tsx
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { Office } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { OfficeSearchBar } from './OfficeSearchBar';

interface Props {
  data: Office[];
  onAdd: () => void;
  onEdit: (office: Office) => void;
  onDelete: (id: number, name: string) => void;
}

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

export const OfficeTable = ({ data, onAdd, onEdit, onDelete }: Props) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
        <div>
          <CardTitle>Offices ({data.length})</CardTitle>
          <CardDescription>Manage office records and their status</CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
        </div>
      </CardHeader>

      <OfficeSearchBar/>
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
              {data.map((office) => (
                <TableRow key={office.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{office.acronym}</TableCell>
                  <TableCell>{office.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(office.isActive ? 'Active' : 'Inactive')}>
                      {office.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(office.createdAt!).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(office)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(office.id, office.name)} className="text-red-600">
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
              No offices found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};