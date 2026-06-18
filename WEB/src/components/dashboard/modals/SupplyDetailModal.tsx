import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, CheckCircle, XCircle, PackageOpen } from 'lucide-react';
import { DashboardSupplyStats } from '@/api/dashboard/dashboardApi';
import { getSupplyItems, PaginatedResult } from '@/api/supply-management/itemApi';
import { VwSupplyItem } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  supplyStats: DashboardSupplyStats | null;
  formatCurrency: (amount: number) => string;
}

export function SupplyDetailModal({ open, onClose, supplyStats, formatCurrency }: Props) {
  const [loading, setLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<VwSupplyItem[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<VwSupplyItem[]>([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getSupplyItems(1, 50, '', undefined, 'Low Stock').catch((): PaginatedResult<VwSupplyItem> => ({ items: [], totalCount: 0 })),
      getSupplyItems(1, 50, '', undefined, 'Out of Stock').catch((): PaginatedResult<VwSupplyItem> => ({ items: [], totalCount: 0 })),
    ]).then(([lowRes, outRes]) => {
      setLowStockItems(lowRes.items);
      setOutOfStockItems(outRes.items);
      setOutOfStockCount(outRes.totalCount);
    }).finally(() => setLoading(false));
  }, [open]);

  const totalItems = supplyStats?.totalItems || 0;
  const lowStockCount = supplyStats?.lowStockCount || 0;
  const sufficientCount = Math.max(totalItems - lowStockCount - outOfStockCount, 0);

  const allAlertItems = [...outOfStockItems, ...lowStockItems];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PackageOpen className="w-5 h-5" />
            </div>
            Supply Inventory Summary
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-amber-900">{formatCurrency(supplyStats?.totalValue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">Total Quantity</p>
                  <p className="text-2xl font-bold text-amber-900">{(supplyStats?.totalQuantity || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">Unique Items</p>
                  <p className="text-2xl font-bold text-amber-900">{totalItems.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Stock Health Cards */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Stock Health</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-700">{sufficientCount.toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">Sufficient</p>
                </div>
                <div className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mb-1 animate-pulse" />
                  <p className="text-2xl font-bold text-amber-700">{lowStockCount.toLocaleString()}</p>
                  <p className="text-xs text-amber-600 font-medium">Low Stock</p>
                </div>
                <div className="flex flex-col items-center bg-red-50 border border-red-200 rounded-lg p-4">
                  <XCircle className="w-5 h-5 text-red-600 mb-1" />
                  <p className="text-2xl font-bold text-red-700">{outOfStockCount.toLocaleString()}</p>
                  <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                </div>
              </div>
            </div>

            {/* Items needing attention */}
            {allAlertItems.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Items Needing Attention
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-slate-600">Status</th>
                          <th className="text-left p-2 font-semibold text-slate-600">Description</th>
                          <th className="text-right p-2 font-semibold text-slate-600">Current Stock</th>
                          <th className="text-right p-2 font-semibold text-slate-600">Reorder Pt.</th>
                          <th className="text-right p-2 font-semibold text-slate-600">Unit Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAlertItems.map((item) => {
                          const isOut = (item.currentStock || 0) <= 0;
                          return (
                            <tr key={item.id} className={`border-t border-slate-100 ${isOut ? 'bg-red-50/50' : 'bg-amber-50/30'}`}>
                              <td className="p-2">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {isOut ? 'OUT' : 'LOW'}
                                </span>
                              </td>
                              <td className="p-2 text-slate-700 max-w-[200px] truncate">{item.description}</td>
                              <td className="p-2 text-right font-semibold text-slate-800">{(item.currentStock || 0).toLocaleString()}</td>
                              <td className="p-2 text-right text-slate-600">{(item.reorderPoint || 0).toLocaleString()}</td>
                              <td className="p-2 text-right text-slate-600">₱{(item.unitCost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-800">All Stocks Healthy</p>
                <p className="text-sm text-green-600">No items are below reorder point</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
