import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Eye, CheckCircle, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VwSupplyIAR } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface Props {
  data: VwSupplyIAR[];
  onAdd: () => void;
  onEdit: (record: VwSupplyIAR) => void;
  onDelete: (record: VwSupplyIAR) => void;
  onView: (record: VwSupplyIAR) => void;
  onApprove: (record: VwSupplyIAR) => void;
}

export const SupplyIARTable = ({ data, onAdd, onEdit, onDelete, onView, onApprove }: Props) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inspection & Acceptance Reports</CardTitle>
            <CardDescription>Manage official IAR documentation</CardDescription>
          </div>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            Generate IAR
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IAR Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Office / Div</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((record: VwSupplyIAR) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-blue-600">{record.iarNumber}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{record.vendor?.name}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium">{record.office?.acronym || 'N/A'}</p>
                        <p className="text-muted-foreground">{record.division?.acronym || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.poNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant={record.isApproved ? 'default' : 'secondary'}
                        className={record.isApproved ? 'bg-green-600' : ''}
                      >
                        {record.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(record)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {!record.isApproved && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(record)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onApprove(record)} className="text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Record
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileQuestion className="h-8 w-8 mb-2 opacity-50" />
                      <p>No IAR records found.</p>
                      <Button 
                        variant="link" 
                        className="text-blue-600 text-xs" 
                        onClick={onAdd}
                      >
                        Click here to generate your first report
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};