import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2, Search, PackageCheck, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { getPendingBookingItems, cancelBookingItem } from '@/api/booking/bookingApi';
import { BookingGroup, PendingBookingItem } from '@/types/booking';
import { BookSupplyItemModal } from './BookSupplyItemModal';
import { BookPTAItemModal } from './BookPTAItemModal';

interface PendingItemsListProps {
  group: BookingGroup;
  onBooked: () => void;
}

export interface PendingItemsListRef {
  reload: () => Promise<void>;
}

export const PendingItemsList = forwardRef<PendingItemsListRef, PendingItemsListProps>(
  function PendingItemsListComponent({ group, onBooked }, ref) {
    const [items, setItems] = useState<PendingBookingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const [bookingItem, setBookingItem] = useState<PendingBookingItem | null>(null);
    const [cancellingItem, setCancellingItem] = useState<PendingBookingItem | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const loadItems = async (search?: string) => {
      try {
        setLoading(true);
        const result = await getPendingBookingItems(group, 'Pending', 1, 9999, search ?? searchInput);
        setItems(result.items);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load pending items';
        toast.error(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({ reload: () => loadItems() }));

    useEffect(() => {
      loadItems();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group]);

    const handleSearch = () => loadItems(searchInput);

    const handleBookSuccess = () => {
      setBookingItem(null);
      loadItems();
      onBooked();
    };

    const confirmCancel = async () => {
      if (!cancellingItem) return;
      try {
        setCancelling(true);
        await cancelBookingItem(cancellingItem.id);
        toast.success('Booking item cancelled');
        setCancellingItem(null);
        loadItems();
        onBooked();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cancel booking item';
        toast.error(message);
      } finally {
        setCancelling(false);
      }
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Search by code or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  loadItems('');
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Pending {group} Items
              <span className="text-sm font-normal text-muted-foreground ml-2">({items.length} total)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items pending booking for {group}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      {group !== 'Supply' && <TableHead>Suggested Property No.</TableHead>}
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Source IAR</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.code || 'N/A'}</TableCell>
                        <TableCell>{item.description || 'N/A'}</TableCell>
                        <TableCell>{item.category?.name || 'N/A'}</TableCell>
                        {group !== 'Supply' && (
                          <TableCell className="font-mono">{item.suggestedPropertyNumber || 'N/A'}</TableCell>
                        )}
                        <TableCell>{item.quantity ?? 'N/A'}</TableCell>
                        <TableCell>{item.unitCost != null ? `₱${item.unitCost.toLocaleString()}` : 'N/A'}</TableCell>
                        <TableCell>{item.iarNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setBookingItem(item)}>
                              <PackageCheck className="w-4 h-4 mr-1" />
                              Book
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setCancellingItem(item)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {group === 'Supply' ? (
          <BookSupplyItemModal
            item={bookingItem && bookingItem.group === 'Supply' ? bookingItem : null}
            onClose={() => setBookingItem(null)}
            onSuccess={handleBookSuccess}
          />
        ) : (
          <BookPTAItemModal
            item={bookingItem && bookingItem.group !== 'Supply' ? bookingItem : null}
            onClose={() => setBookingItem(null)}
            onSuccess={handleBookSuccess}
          />
        )}

        <AlertDialog open={!!cancellingItem} onOpenChange={(open) => !open && setCancellingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel booking for{' '}
                <span className="font-semibold">{cancellingItem?.description || cancellingItem?.code}</span>?
                This item will no longer be available to book.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Back</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel} disabled={cancelling} className="bg-red-600 hover:bg-red-700">
                {cancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Cancel Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);
