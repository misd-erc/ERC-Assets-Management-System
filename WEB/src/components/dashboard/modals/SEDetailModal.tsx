import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { PTADashboardData } from '@/api/dashboard/dashboardApi';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  formatCurrency: (amount: number) => string;
}

export function SEDetailModal({ open, onClose, ptaData, formatCurrency }: Props) {
  const totalSE = ptaData?.totalSE || 0;
  const totalValue = ptaData?.totalSEValue || 0;
  const breakdown = ptaData?.seCategoryBreakdown || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Package className="w-5 h-5" />
            </div>
            Semi-Expendable Asset Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hero Stats */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-green-900">{totalSE.toLocaleString()}</p>
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
                    <th className="text-right p-3 font-semibold w-28">Units</th>
                    <th className="text-right p-3 font-semibold w-24">Issued</th>
                    <th className="text-right p-3 font-semibold w-24">On Stock</th>
                    <th className="text-right p-3 font-semibold w-40">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((cat, i) => (
                    <tr key={cat.name} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-green-50/50 transition-colors`}>
                      <td className="p-3 text-slate-700 font-medium">{cat.name}</td>
                      <td className="p-3 text-right text-slate-800">{cat.count.toLocaleString()} units</td>
                      <td className="p-3 text-right text-green-700 font-medium">{(cat.issuedCount || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-teal-700 font-medium">{(cat.stockCount || 0).toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-800 font-medium">{formatCurrency(cat.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-green-300 bg-green-50 font-bold">
                    <td className="p-3 text-green-900">Total</td>
                    <td className="p-3 text-right text-green-900">{totalSE.toLocaleString()} units</td>
                    <td className="p-3 text-right text-green-900">{breakdown.reduce((sum, c) => sum + (c.issuedCount || 0), 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-green-900">{breakdown.reduce((sum, c) => sum + (c.stockCount || 0), 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-green-900">{formatCurrency(totalValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
