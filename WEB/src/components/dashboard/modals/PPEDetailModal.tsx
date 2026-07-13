import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, ChevronLeft } from 'lucide-react';
import { PTADashboardData } from '@/api/dashboard/dashboardApi';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  formatCurrency: (amount: number) => string;
}

export function PPEDetailModal({ open, onClose, ptaData, formatCurrency }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalPPE = ptaData?.totalPPE || 0;
  const totalValue = ptaData?.totalPPEValue || 0;
  const breakdown = ptaData?.ppeCategoryBreakdown || [];
  const items = ptaData?.items || [];

  const categoryItems = selectedCategory
    ? items.filter(i => i.group === 'PPE' && i.category === selectedCategory)
    : [];

  const handleClose = () => {
    setSelectedCategory(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            PPE Asset Summary
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
                  <tr className="bg-blue-600 text-white">
                    <th className="text-left p-2.5 font-semibold w-10">#</th>
                    <th className="text-left p-2.5 font-semibold">Description</th>
                    <th className="text-left p-2.5 font-semibold w-32">Brand / Model</th>
                    <th className="text-right p-2.5 font-semibold w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((item, i) => (
                    <tr key={`${item.propertyNumber}-${i}`} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition-colors`}>
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{item.description || '—'}</td>
                      <td className="p-2.5 text-slate-600 text-xs">{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="p-2.5 text-right text-slate-800 font-medium">{formatCurrency(item.value)}</td>
                    </tr>
                  ))}
                  {categoryItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
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
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Item/s</p>
                  <p className="text-2xl font-bold text-blue-900">{totalPPE.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* RPCPPE-style Category Breakdown Table */}
            {breakdown.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-right p-3 font-semibold w-28">Item/s</th>
                      <th className="text-right p-3 font-semibold w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((cat, i) => (
                      <tr
                        key={cat.name}
                        className={`border-t cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-100/70 transition-colors`}
                        onClick={() => setSelectedCategory(cat.name)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCategory(cat.name); } }}
                      >
                        <td className="p-3 text-slate-700 font-medium">{cat.name}</td>
                        <td className="p-3 text-right text-slate-800">{cat.count.toLocaleString()} item/s</td>
                        <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(cat.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-blue-300 bg-blue-50 font-bold">
                      <td className="p-3 text-blue-900">Total</td>
                      <td className="p-3 text-right text-blue-900">{totalPPE.toLocaleString()} item/s</td>
                      <td className="p-3 text-right text-blue-900">{formatCurrency(totalValue)}</td>
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
