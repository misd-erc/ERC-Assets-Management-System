import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PackageOpen } from 'lucide-react';
import { DashboardSupplyStats } from '@/api/dashboard/dashboardApi';

interface Props {
  open: boolean;
  onClose: () => void;
  supplyStats: DashboardSupplyStats | null;
  formatCurrency: (amount: number) => string;
}

export function SupplyDetailModal({ open, onClose, supplyStats, formatCurrency }: Props) {
  const totalQuantity = supplyStats?.totalQuantity || 0;
  const totalValue = supplyStats?.totalValue || 0;
  const totalItems = supplyStats?.totalItems || 0;
  const breakdown = supplyStats?.categoryBreakdown || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PackageOpen className="w-5 h-5" />
            </div>
            Supply Inventory Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hero Stats */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-amber-700 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-amber-700 font-medium">Total Quantity</p>
                <p className="text-2xl font-bold text-amber-900">{totalQuantity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-amber-700 font-medium">Unique Items</p>
                <p className="text-2xl font-bold text-amber-900">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* RPCPPE-style Category Breakdown Table */}
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
      </DialogContent>
    </Dialog>
  );
}
