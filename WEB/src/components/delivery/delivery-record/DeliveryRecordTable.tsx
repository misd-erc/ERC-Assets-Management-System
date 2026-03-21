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
import { Edit, Trash2, MoreHorizontal, Eye, PackageOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VwDeliveryRecord } from '@/types/delivery/delivery';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';

interface Props {
  data: VwDeliveryRecord[];
  onAdd: () => void;
  onEdit: (record: VwDeliveryRecord) => void;
  onDelete: (record: VwDeliveryRecord) => void;
  onView: (record: VwDeliveryRecord) => void;
}

export const DeliveryRecordTable = ({ data, onAdd, onEdit, onDelete, onView }: Props) => {
  const getTotalValue = (items: any[]) => items.reduce((sum, item) => sum + (item.itemQuantity * item.unitCost), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Delivery Records</CardTitle>
            <CardDescription>Manage incoming deliveries and receipts</CardDescription>
          </div>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            Record Delivery
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DR Number</TableHead>
                <TableHead>Linked IAR / PO</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-blue-600">{record.drNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{record.supplyIAR?.iarNumber}</div>
                        <div className="text-xs text-muted-foreground">PO: {record.supplyIAR?.poNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>{record.supplyIAR?.vendor?.name || 'Unknown Vendor'}</TableCell>
                    <TableCell>{formatDate(record.deliveryDate)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(getTotalValue(record.items || []))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.isReceived ? "default" : "secondary"}
                         className={record.isReceived ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                      >
                        {record.isReceived ? 'Received' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(record)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {!record.isReceived && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(record)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
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
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <PackageOpen className="h-10 w-10 opacity-20" />
                      <p className="text-sm">No delivery records found.</p>
                      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2 text-xs">
                        Add New Delivery
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