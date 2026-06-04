// src/components/contract-management/vendor/VendorTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Vendor } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface Props {
  data: Vendor[];
  usageCounts: Record<number, number>;
  onAdd: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
  onViewLinkedItems: (vendor: Vendor) => void;
}

export const VendorTable = ({ data, usageCounts, onAdd, onEdit, onDelete, onViewLinkedItems }: Props) => {
  // console.log(`This is the vendor data: ${data}`);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>Manage suppliers and service providers</CardDescription>
          </div>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2"/> Add Vendor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Procurement / Terms</TableHead>
                <TableHead>Contract / Delivery Dates</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center w-[130px]">Supplied Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((vendor) => {
                const itemCount = usageCounts[vendor.id] || 0;
                const vType = vendor.vendorType || (vendor.contractStart || vendor.contractEnd ? 'Service' : 'Goods');

                return (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-semibold text-slate-900">{vendor.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={vType === 'Service' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                      >
                        {vType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-medium text-slate-800" title={vendor.procurementTitle || ''}>
                        {vendor.procurementTitle || '-'}
                      </div>
                      {vendor.terms && (
                        <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[200px]" title={vendor.terms}>
                          Terms: {vendor.terms}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vType === 'Service' ? (
                        vendor.contractStart || vendor.contractEnd ? (
                          <div className="text-xs space-y-0.5">
                            <span className="text-slate-500 font-medium">Contract:</span>
                            <div className="font-semibold text-slate-700">
                              {vendor.contractStart ? formatDate(vendor.contractStart) : 'N/A'} - {vendor.contractEnd ? formatDate(vendor.contractEnd) : 'N/A'}
                            </div>
                          </div>
                        ) : '-'
                      ) : (
                        vendor.deliveryDate || vendor.deliveryDueDate ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium text-slate-700">
                              <span className="text-slate-500 font-medium">Delivered:</span> {vendor.deliveryDate ? formatDate(vendor.deliveryDate) : 'N/A'}
                            </div>
                            <div className="font-medium text-slate-700">
                              <span className="text-slate-500 font-medium">Due:</span> {vendor.deliveryDueDate ? formatDate(vendor.deliveryDueDate) : 'N/A'}
                            </div>
                          </div>
                        ) : '-'
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600 truncate max-w-[150px]" title={vendor.address}>{vendor.address}</TableCell>
                    <TableCell className="font-medium text-slate-600 truncate max-w-[150px]" title={vendor.email}>{vendor.email}</TableCell>
                    <TableCell className="font-medium text-slate-700">
                      <div className="text-xs font-semibold">{vendor.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{vendor.contact}</div>
                    </TableCell>
                    <TableCell className="text-center">
                       {itemCount > 0 ? (
                         <Button 
                            variant="ghost" 
                            className="h-auto p-0 hover:bg-transparent"
                            onClick={() => onViewLinkedItems(vendor)}
                         >
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">
                                {itemCount} Items
                            </Badge>
                         </Button>
                       ) : (
                         <span className="text-muted-foreground text-sm">-</span>
                       )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? "default" : "secondary"} className={vendor.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => onEdit(vendor)}>
                             <Edit className="w-4 h-4 mr-2"/> Edit
                           </DropdownMenuItem>
                           
                           <DropdownMenuItem 
                             onClick={() => onDelete(vendor)} 
                             disabled={itemCount > 0} 
                             className="text-red-600 focus:text-red-600 disabled:opacity-50"
                           >
                             <Trash2 className="w-4 h-4 mr-2"/> Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && <TableRow><TableCell colSpan={10} className="text-center h-24">No vendors found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};