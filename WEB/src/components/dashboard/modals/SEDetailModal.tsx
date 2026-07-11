import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, PackageCheck, PackageMinus, ChevronLeft } from 'lucide-react';
import { PTADashboardData } from '@/api/dashboard/dashboardApi';
import { useEffect, useState } from 'react';

type ViewMode = 'all' | 'issued' | 'stock';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  formatCurrency: (amount: number) => string;
  initialViewMode?: ViewMode;
}

export function SEDetailModal({ open, onClose, ptaData, formatCurrency, initialViewMode = 'all' }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setViewMode(initialViewMode); setSelectedCategory(null); }
  }, [open, initialViewMode]);

  const totalSE = ptaData?.totalSE || 0;
  const totalValue = ptaData?.totalSEValue || 0;
  const seIssued = ptaData?.totalSEIssued || 0;
  const seStock = ptaData?.totalSEStock || 0;
  const seIssuedValue = ptaData?.totalSEIssuedValue || 0;
  const seStockValue = ptaData?.totalSEStockValue || 0;
  const breakdown = ptaData?.seCategoryBreakdown || [];
  const items = ptaData?.items || [];

  const showIssued = viewMode === 'all' || viewMode === 'issued';
  const showStock = viewMode === 'all' || viewMode === 'stock';

  const categoryItems = selectedCategory
    ? items.filter(i => i.group === 'SE' && i.category === selectedCategory
        && (viewMode === 'all' || (viewMode === 'issued' && i.isIssued) || (viewMode === 'stock' && !i.isIssued)))
    : [];

  const handleClose = () => {
    setViewMode('all');
    setSelectedCategory(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Package className="w-5 h-5" />
            </div>
            Semi-Expendable Asset Summary
          </DialogTitle>
        </DialogHeader>

        {selectedCategory ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-sm font-semibold text-slate-800">{selectedCategory} ({categoryItems.length})</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="text-left p-2.5 font-semibold w-10">#</th>
                    <th className="text-left p-2.5 font-semibold">Description</th>
                    <th className="text-left p-2.5 font-semibold w-32">Brand / Model</th>
                    <th className="text-left p-2.5 font-semibold w-20">Status</th>
                    <th className="text-right p-2.5 font-semibold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((item, i) => (
                    <tr key={`${item.propertyNumber}-${i}`} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-green-50/50 transition-colors`}>
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{item.description || '—'}</td>
                      <td className="p-2.5 text-slate-600 text-xs">{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="p-2.5 text-xs">
                        <span className={item.isIssued ? 'text-green-700 font-medium' : 'text-teal-700 font-medium'}>
                          {item.isIssued ? 'Issued' : 'On Stock'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-800 font-medium">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                  {categoryItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No item/s found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Item/s</p>
                  <p className="text-2xl font-bold text-green-900">{totalSE.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Issued vs On Stock - click to filter the table below */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Issued vs On Stock</p>
                {viewMode !== 'all' && (
                  <button
                    onClick={() => setViewMode('all')}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Show both
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 divide-x">
                <div
                  className={`p-4 cursor-pointer hover:bg-green-50 transition-colors ${viewMode === 'issued' ? 'bg-green-50' : ''}`}
                  onClick={() => setViewMode(viewMode === 'issued' ? 'all' : 'issued')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode(viewMode === 'issued' ? 'all' : 'issued'); } }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PackageMinus className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Issued</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(seIssuedValue)}</p>
                  <p className="text-xs text-slate-500 mt-1">{seIssued.toLocaleString()} item/s &middot; click to view column</p>
                </div>
                <div
                  className={`p-4 cursor-pointer hover:bg-teal-50 transition-colors ${viewMode === 'stock' ? 'bg-teal-50' : ''}`}
                  onClick={() => setViewMode(viewMode === 'stock' ? 'all' : 'stock')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode(viewMode === 'stock' ? 'all' : 'stock'); } }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <PackageCheck className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium text-slate-700">On Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-700">{formatCurrency(seStockValue)}</p>
                  <p className="text-xs text-slate-500 mt-1">{seStock.toLocaleString()} item/s &middot; click to view column</p>
                </div>
              </div>
            </div>

            {/* RPCPPE-style Category Breakdown Table */}
            {breakdown.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-right p-3 font-semibold w-28">Item/s</th>
                      {showIssued && <th className="text-right p-3 font-semibold w-24">Issued</th>}
                      {showStock && <th className="text-right p-3 font-semibold w-24">On Stock</th>}
                      <th className="text-right p-3 font-semibold w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((cat, i) => (
                      <tr
                        key={cat.name}
                        className={`border-t cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-green-100/70 transition-colors`}
                        onClick={() => setSelectedCategory(cat.name)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCategory(cat.name); } }}
                      >
                        <td className="p-3 text-slate-700 font-medium">{cat.name}</td>
                        <td className="p-3 text-right text-slate-800">{cat.count.toLocaleString()} item/s</td>
                        {showIssued && <td className="p-3 text-right text-green-700 font-medium">{(cat.issuedCount || 0).toLocaleString()}</td>}
                        {showStock && <td className="p-3 text-right text-teal-700 font-medium">{(cat.stockCount || 0).toLocaleString()}</td>}
                        <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(cat.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-green-300 bg-green-50 font-bold">
                      <td className="p-3 text-green-900">Total</td>
                      <td className="p-3 text-right text-green-900">{totalSE.toLocaleString()} item/s</td>
                      {showIssued && <td className="p-3 text-right text-green-900">{breakdown.reduce((sum, c) => sum + (c.issuedCount || 0), 0).toLocaleString()}</td>}
                      {showStock && <td className="p-3 text-right text-green-900">{breakdown.reduce((sum, c) => sum + (c.stockCount || 0), 0).toLocaleString()}</td>}
                      <td className="p-3 text-right text-green-900">{formatCurrency(totalValue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
