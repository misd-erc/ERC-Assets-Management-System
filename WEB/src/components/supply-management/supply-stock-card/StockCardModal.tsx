import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

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
    if (item.addedStockQuantity > 0) return { label: 'Delivery', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (item.issuedStockQuantity > 0) return { label: 'Issuance', classes: 'bg-red-50 text-red-700 border-red-200' };
    return { label: 'Unknown', classes: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[75vw] !w-[75vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

          <div className="p-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">
                Stock Card: <span className="text-blue-600">{stockNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                {description}
              </DialogDescription>
              <p className="text-sm text-slate-500 mt-1">
                Chronological record of stock movements for this item.
              </p>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            <Table>
              <TableHeader className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[120px]">Reference ID</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right">Issued</TableHead>
                  <TableHead className="text-right">New Stock</TableHead>
                  <TableHead className="max-w-[200px]">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* SKELETON LOADER */}
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 9 }).map((_, colIndex) => (
                              <TableCell key={`skel-col-${colIndex}`}>
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-full"></div>
                              </TableCell>
                          ))}
                        </TableRow>
                    ))
                ) : stockCardItems.length > 0 ? (
                    // NORMAL DATA RENDERING
                    stockCardItems.map((item) => {
                      const eventType = getEventType(item);
                      return (
                          <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-slate-600 whitespace-nowrap">
                              {formatDate(item.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${eventType.classes} whitespace-nowrap`}>
                                {eventType.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700">
                              {item.id}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {item.unit?.name || '—'}
                            </TableCell>
                            <TableCell className="text-right text-slate-600">
                              {item.currentStockQuantity}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                              {item.addedStockQuantity > 0 ? `+${item.addedStockQuantity}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {item.issuedStockQuantity > 0 ? `-${item.issuedStockQuantity}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {item.newStockQuantity}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-slate-600" title={item.itemRemarks || ''}>
                              {item.itemRemarks || '—'}
                            </TableCell>
                          </TableRow>
                      );
                    })
                ) : (
                    // POLISHED EMPTY STATE
                    <TableRow>
                      <TableCell colSpan={9} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                          <div className="p-3 bg-slate-50 rounded-full">
                            <ClipboardList className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-900">No stock history found</p>
                          <p className="text-sm">
                            There are no recorded movements (deliveries or issuances) for this item yet.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer with Pagination and Close Button */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">

            <div className="flex-1">
              {!loading && totalPages > 0 && (
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-medium text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> entries
                    </p>

                    {totalPages > 1 && (
                        <div className="flex items-center space-x-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                              className="shadow-sm h-8 px-3"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                          </Button>
                          <div className="text-sm text-slate-600 font-medium px-2">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className="shadow-sm h-8 px-3"
                          >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                    )}
                  </div>
              )}
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)} className="shadow-sm shrink-0">
              Close Panel
            </Button>
          </div>

        </DialogContent>
      </Dialog>
  );
};