import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Eye, CheckCircle } from 'lucide-react';
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
  const getTotalValue = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.itemQuantity * item.unitCost), 0);
  };

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
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-blue-600">{record.drNumber}</TableCell>
                  <TableCell>{record.poNumber}</TableCell>
                  <TableCell>{record.vendor?.name || 'Unknown Vendor'}</TableCell>
                  <TableCell>{formatDate(record.deliveryDate)}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(getTotalValue(record.items || []))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.isReceived ? "default" : "secondary"} className={record.isReceived ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      {record.isReceived ? 'Received' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4"/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(record)}>
                          <Eye className="w-4 h-4 mr-2"/> View Details
                        </DropdownMenuItem>
                        
                        {!record.isReceived && (
                            <DropdownMenuItem onClick={() => onEdit(record)}>
                            <Edit className="w-4 h-4 mr-2"/> Edit
                            </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => onDelete(record)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24">No records found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};