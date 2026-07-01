import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Package } from 'lucide-react';
import { PTADashboardData } from '@/api/dashboard/dashboardApi';
import { listSePpeItemsNoMovement, PtaItem } from '@/api/asset/ptaMovementApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
}

export function SEStockIssuedModal({ open, onClose, ptaData }: Props) {
  const [loading, setLoading] = useState(false);
  const [inStockItems, setInStockItems] = useState<PtaItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listSePpeItemsNoMovement('SE')
      .then(setInStockItems)
      .catch(() => setInStockItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const totalSE = ptaData?.totalSE || 0;
  const issuedCount = ptaData?.totalSEIssued || 0;
  const inStockCount = ptaData?.totalSEStock || 0;
  const issuedPct = totalSE > 0 ? ((issuedCount / totalSE) * 100).toFixed(1) : '0';
  const stockPct = totalSE > 0 ? ((inStockCount / totalSE) * 100).toFixed(1) : '0';

  const chartData = [
    { name: 'Issued', value: issuedCount },
    { name: 'In Stock', value: inStockCount },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Package className="w-5 h-5" />
            </div>
            Semi-Expendable — Stock & Issuance
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* Main visual: donut chart + legend cards */}
            <div className="grid grid-cols-5 gap-4 items-center">
              <div className="col-span-2 relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} strokeWidth={3} paddingAngle={2}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip formatter={(val: number) => val.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{totalSE.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-medium">TOTAL</p>
                  </div>
                </div>
              </div>

              <div className="col-span-3 space-y-3">
                {/* Issued card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-semibold text-blue-800">Issued</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{issuedCount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${issuedPct}%` }} />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{issuedPct}% of total — assigned to employees</p>
                </div>

                {/* In Stock card */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-800">In Stock</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">{inStockCount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stockPct}%` }} />
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">{stockPct}% of total — available for issuance</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
