import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PackageOpen, ChevronLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { DashboardSupplyStats, SupplyStockHealthItem } from '@/api/dashboard/dashboardApi';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  supplyStats: DashboardSupplyStats | null;
  formatCurrency: (amount: number) => string;
}

type ViewMode = 'summary' | 'sufficient' | 'low-stock' | 'out-of-stock';

export function SupplyDetailModal({ open, onClose, supplyStats, formatCurrency }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  const totalQuantity = supplyStats?.totalQuantity || 0;
  const totalValue = supplyStats?.totalValue || 0;
  const breakdown = supplyStats?.categoryBreakdown || [];
  const stockHealthItems = supplyStats?.stockHealthItems || [];
  const sufficientCount = supplyStats?.sufficientStockCount || 0;
  const outOfStockCount = stockHealthItems.filter(i => i.stockOnHand === 0).length;
  const lowStockCount = stockHealthItems.filter(i => i.isLowStock && i.stockOnHand > 0).length;

  const handleClose = () => {
    setViewMode('summary');
    onClose();
  };

  const getFilteredItems = (): SupplyStockHealthItem[] => {
    switch (viewMode) {
      case 'sufficient':
        return stockHealthItems.filter(i => !i.isLowStock);
      case 'low-stock':
        return stockHealthItems.filter(i => i.isLowStock && i.stockOnHand > 0);
      case 'out-of-stock':
        return stockHealthItems.filter(i => i.stockOnHand === 0);
      default:
        return [];
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'sufficient':
        return `Sufficient Stock (${sufficientCount})`;
      case 'low-stock':
        return `Low Stock (${lowStockCount})`;
      case 'out-of-stock':
        return `Out of Stock (${outOfStockCount})`;
      default:
        return '';
    }
  };

  const filteredItems = getFilteredItems();

  const getViewAccent = () => {
    switch (viewMode) {
      case 'low-stock':
        return { header: 'bg-amber-600', footer: 'border-amber-300 bg-amber-50' };
      case 'out-of-stock':
        return { header: 'bg-red-600', footer: 'border-red-300 bg-red-50' };
      default:
        return { header: 'bg-green-700', footer: 'border-green-300 bg-green-50' };
    }
  };
  const viewAccent = getViewAccent();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PackageOpen className="w-5 h-5" />
            </div>
            Supply Inventory Summary
          </DialogTitle>
        </DialogHeader>

        {viewMode === 'summary' ? (
          <div className="space-y-4">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-medium">Total Quantity</p>
                  <p className="text-2xl font-bold text-amber-900">{totalQuantity.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Stock Health Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b">
                <p className="text-sm font-semibold text-slate-700">Stock Health</p>
              </div>
              <div className="grid grid-cols-3 divide-x">
                <div
                  className="p-4 cursor-pointer hover:bg-green-50 transition-colors"
                  onClick={() => setViewMode('sufficient')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('sufficient'); } }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Sufficient</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{sufficientCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to view items</p>
                </div>
                <div
                  className="p-4 cursor-pointer hover:bg-amber-50 transition-colors"
                  onClick={() => setViewMode('low-stock')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('low-stock'); } }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">Low Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">{lowStockCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to view items</p>
                </div>
                <div
                  className="p-4 cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => setViewMode('out-of-stock')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('out-of-stock'); } }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-slate-700">Out of Stock</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{outOfStockCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to view items</p>
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            {breakdown.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-600 text-white">
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-right p-3 font-semibold w-28">Qty</th>
                      <th className="text-right p-3 font-semibold w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((cat, i) => (
                      <tr key={cat.name} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-amber-50/50 transition-colors`}>
                        <td className="p-3 text-slate-700 font-medium">{cat.name}</td>
                        <td className="p-3 text-right text-slate-800">{cat.quantity.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(cat.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-amber-300 bg-amber-50 font-bold">
                      <td className="p-3 text-amber-900">Total</td>
                      <td className="p-3 text-right text-amber-900">{totalQuantity.toLocaleString()}</td>
                      <td className="p-3 text-right text-amber-900">{formatCurrency(totalValue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back button + title */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('summary')}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-sm font-semibold text-slate-800">{getViewTitle()}</span>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-white ${viewAccent.header}`}>
                    <th className="text-left p-2.5 font-semibold w-10">#</th>
                    <th className="text-left p-2.5 font-semibold">Item Description</th>
                    <th className="text-left p-2.5 font-semibold w-36">Category</th>
                    <th className="text-right p-2.5 font-semibold w-20">Qty</th>
                    <th className="text-right p-2.5 font-semibold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, i) => (
                    <tr key={`${item.code}-${item.description}`} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100 transition-colors`}>
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{item.description}</td>
                      <td className="p-2.5 text-slate-600 text-xs">{item.category}</td>
                      <td className="p-2.5 text-right text-slate-800">{item.stockOnHand.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-slate-800 font-medium">{formatCurrency(item.totalValue)}</td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot>
                    <tr className={`border-t-2 font-bold ${viewAccent.footer}`}>
                      <td className="p-2.5" colSpan={3}>Total</td>
                      <td className="p-2.5 text-right">{filteredItems.reduce((s, i) => s + i.stockOnHand, 0).toLocaleString()}</td>
                      <td className="p-2.5 text-right">{formatCurrency(filteredItems.reduce((s, i) => s + i.totalValue, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
