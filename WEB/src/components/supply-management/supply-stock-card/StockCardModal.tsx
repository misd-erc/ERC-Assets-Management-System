import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStockCard } from '@/hooks/supply/useStockCard';
import { useSupplyUnit } from '@/hooks';
import { createManualStockCardIssuance } from '@/api/supply-management/stockCardApi';
import { formatDate } from '@/utils/dateUtils';
import { SupplyStockCardItem } from '@/types/supply/stockcard';
import { ChevronLeft, ChevronRight, ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockNumber: string;
  description: string;
}

export const StockCardModal = ({ open, onOpenChange, stockNumber, description }: Props) => {
  const { stockCardItems, loading, totalCount, fetchStockCardItems, reset, setPage, currentPage, pageSize } = useStockCard();
  const { units, fetchSupplyUnits } = useSupplyUnit();
  const [showIssuanceForm, setShowIssuanceForm] = useState(false);
  const [isSavingIssuance, setIsSavingIssuance] = useState(false);
  const [entries, setEntries] = useState([
    { unitId: 0, issueQuantity: 0, itemRemarks: '' }
  ]);
  const getAcronym = (text: string | undefined | null): string => {
    if (!text) return ''; // Safely handle empty/undefined data

    // Add any other connecting words you want to ignore here
    const ignoredWords: string[] = ['and', 'of', 'the', 'in', 'for', 'on', 'with', 'at', 'to', 'a', 'an'];

    return text
        .split(' ') // Split the sentence into an array of words
        .filter((word: string) => !ignoredWords.includes(word.toLowerCase())) // Remove the connecting words
        .map((word: string) => word.charAt(0)) // Grab the first letter of what's left
        .join('') // Put them back together
        .toUpperCase(); // Ensure it's fully capitalized
  };

  useEffect(() => {
    if (open && stockNumber && description) {
      fetchStockCardItems(stockNumber, description, 1);
      fetchSupplyUnits();
    }
    return () => {
      reset();
      setShowIssuanceForm(false);
      setEntries([{ unitId: 0, issueQuantity: 0, itemRemarks: '' }]);
    };
  }, [open, stockNumber, description, fetchStockCardItems, fetchSupplyUnits, reset]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePreviousPage = () => {
    if (currentPage > 1) setPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setPage(currentPage + 1);
  };

  const addEntryRow = () => {
    setEntries((prev) => [...prev, { unitId: 0, issueQuantity: 0, itemRemarks: '' }]);
  };

  const removeEntryRow = (index: number) => {
    setEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateEntryRow = (index: number, field: 'unitId' | 'issueQuantity' | 'itemRemarks', value: string | number) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const handleSubmitIssuance = async () => {
    const normalizedEntries = entries
      .map((entry) => ({
        unitId: Number(entry.unitId),
        issueQuantity: Number(entry.issueQuantity),
        itemRemarks: entry.itemRemarks?.trim() || undefined,
      }))
      .filter((entry) => entry.unitId > 0 && entry.issueQuantity > 0);

    if (normalizedEntries.length === 0) {
      toast.error('Please provide at least one valid issuance entry.');
      return;
    }

    try {
      setIsSavingIssuance(true);
      await createManualStockCardIssuance(stockNumber, description, normalizedEntries);
      toast.success('Manual issuance recorded successfully.');
      setEntries([{ unitId: 0, issueQuantity: 0, itemRemarks: '' }]);
      setShowIssuanceForm(false);
      await fetchStockCardItems(stockNumber, description, 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record manual issuance.');
    } finally {
      setIsSavingIssuance(false);
    }
  };

  const getEventType = (item: SupplyStockCardItem) => {
    if (item.addedStockQuantity > 0) return { label: 'Delivery', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' };
    if (item.issuedStockQuantity > 0) return { label: 'Issuance', classes: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' };
    return { label: 'Unknown', classes: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' };
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[80vw] !w-[80vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

          {/* Header Section */}
          <div className="p-6 pb-4 border-b border-slate-200 bg-white">
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

          {showIssuanceForm && (
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 space-y-3 max-h-[45vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">Items</p>
                <Button type="button" variant="outline" size="sm" onClick={addEntryRow}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={`entry-${index}`} className="border rounded-md p-4 space-y-3 relative bg-white">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 hover:bg-red-50"
                      onClick={() => removeEntryRow(index)}
                      disabled={entries.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Stock Number</Label>
                        <Input value={stockNumber} disabled className="bg-slate-50 text-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Description</Label>
                        <Input value={description} disabled className="bg-slate-50 text-slate-700" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Unit</Label>
                        <Select
                          value={entry.unitId > 0 ? entry.unitId.toString() : undefined}
                          onValueChange={(value) => updateEntryRow(index, 'unitId', Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Requisition Quantity</Label>
                        <Input value="0" disabled className="bg-slate-50 text-slate-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-700 font-medium">Issue Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={entry.issueQuantity === 0 ? '' : entry.issueQuantity}
                          placeholder="0"
                          onChange={(e) => updateEntryRow(index, 'issueQuantity', e.target.value === '' ? 0 : Number(e.target.value))}
                          onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Remarks</Label>
                      <Textarea
                        value={entry.itemRemarks}
                        onChange={(e) => updateEntryRow(index, 'itemRemarks', e.target.value)}
                        placeholder="Optional remarks"
                        className="min-h-[40px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIssuanceForm(false)}
                    disabled={isSavingIssuance}
                  >
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleSubmitIssuance} disabled={isSavingIssuance}>
                    {isSavingIssuance ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Issuance'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table Body Section */}
          <div className="flex-1 overflow-y-auto bg-white">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[140px]">Reference ID</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="text-right">Receipt QTY</TableHead>
                  <TableHead className="text-right">Issued QTY</TableHead>
                  <TableHead className="w-[150px] text-right">Office</TableHead>
                  <TableHead className="w-[120px] text-right">Balance</TableHead>
                  <TableHead className="text-right">Days Consumed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* SKELETON LOADER */}
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array.from({ length: 8 }).map((_, colIndex) => (
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
                          <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="text-slate-600 whitespace-nowrap">
                              {formatDate(item.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium text-slate-700">
                              {item.stockNumber}
                            </TableCell>

                            {/* ADDED: Missing Badge Render */}
                            <TableCell>
                              <Badge variant="outline" className={eventType.classes}>
                                {eventType.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-medium text-emerald-600">
                              {item.addedStockQuantity > 0 ? `+${item.addedStockQuantity}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {item.issuedStockQuantity > 0 ? `-${item.issuedStockQuantity}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-900">
                              {item.office?.name
                                  ? `${getAcronym(item.office.name)} ${getAcronym(item.division?.name)}`
                                  : ""
                              }
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {item.newStockQuantity}
                            </TableCell>
                            <TableCell className="max-w-[150px] text-right truncate text-slate-600">
                              {item.issuedStockQuantity ? "30" : ""}
                            </TableCell>
                          </TableRow>
                      );
                    })
                ) : (
                    // POLISHED EMPTY STATE
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center">
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

          {/* Footer Section */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">

            {/* Left: Info */}
            <div className="w-1/3 text-left">
              {!loading && totalCount > 0 && (
                  <p className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span>
                  </p>
              )}
            </div>

            {/* Center: Pagination controls */}
            <div className="w-1/3 flex justify-center">
              {!loading && totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="shadow-sm h-8 px-3"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="text-sm text-slate-600 font-medium px-2 whitespace-nowrap">
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

            {/* Right: Actions */}
            <div className="w-1/3 flex justify-end gap-2">
              <Button
                variant="default"
                onClick={() => setShowIssuanceForm((prev) => !prev)}
                className="shadow-sm shrink-0"
                disabled={loading || isSavingIssuance}
              >
                Issuance
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="shadow-sm shrink-0">
                Close Panel
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
  );
};