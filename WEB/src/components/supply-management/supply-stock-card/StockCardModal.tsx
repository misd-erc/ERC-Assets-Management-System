// src/components/supply-management/stock-card/StockCardModal.tsx
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStockCard } from '@/hooks/supply/useStockCard';
import { formatDate } from '@/utils/dateUtils';
import { SupplyStockCardItem } from '@/types/supply/stockcard';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
}

export const StockCardModal = ({ open, onOpenChange, stockNumber, description }: Props) => {
  const { stockCardItems, loading, totalCount, fetchStockCardItems, reset, setPage, currentPage, pageSize } = useStockCard();

  useEffect(() => {
    if (open && stockNumber && description) {
      fetchStockCardItems(stockNumber, description, 1);
    }
    return () => {
      reset();
    };
  }, [open, stockNumber, description, fetchStockCardItems, reset]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePreviousPage = () => {
    if (currentPage > 1) setPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setPage(currentPage + 1);
  };

  const getEventType = (item: SupplyStockCardItem) => {
    if (item.addedStockQuantity > 0) return { label: 'Delivery', color: 'bg-green-100 text-green-800' };
    if (item.issuedStockQuantity > 0) return { label: 'Issuance', color: 'bg-red-100 text-red-800' };
    return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[70vw] !w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Card: {stockNumber} - {description}</DialogTitle>
          <DialogDescription>
            Chronological record of stock movements for this item.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading stock card...</span>
          </div>
        ) : stockCardItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No stock card records found.
          </div>
        ) : (
          <>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference ID</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockCardItems.map((item) => {
                    const eventType = getEventType(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={eventType.color}>{eventType.label}</Badge>
                        </TableCell>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.unit?.name || '—'}</TableCell>
                        <TableCell>{item.currentStockQuantity}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {item.addedStockQuantity > 0 ? `+${item.addedStockQuantity}` : '—'}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {item.issuedStockQuantity > 0 ? `-${item.issuedStockQuantity}` : '—'}
                        </TableCell>
                        <TableCell className="font-semibold">{item.newStockQuantity}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.itemRemarks || ''}>
                          {item.itemRemarks || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};