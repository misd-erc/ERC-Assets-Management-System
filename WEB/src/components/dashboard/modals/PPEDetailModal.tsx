import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Package, Layers, CheckCircle, Archive } from 'lucide-react';
import { getAssetOverview, DashboardAssetOverview, PTADashboardData } from '@/api/dashboard/dashboardApi';
import { listSePpeItemsNoMovement } from '@/api/asset/ptaMovementApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PPEDetailModal({ open, onClose, ptaData, formatCurrency }: Props) {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<DashboardAssetOverview | null>(null);
  const [inStockCount, setInStockCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getAssetOverview().catch(() => null),
      listSePpeItemsNoMovement('PPE').catch(() => []),
    ]).then(([ov, noMovItems]) => {
      setOverview(ov);
      setInStockCount(noMovItems.length);
    }).finally(() => setLoading(false));
  }, [open]);

  const totalPPE = ptaData?.totalPPE || 0;
  const assignedCount = totalPPE - inStockCount;
  const stockData = [
    { name: 'Assigned', value: assignedCount > 0 ? assignedCount : 0 },
    { name: 'In Stock', value: inStockCount },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            PPE Asset Summary
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(ptaData?.totalPPEValue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-blue-900">{totalPPE.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Portfolio Share</p>
                  <p className="text-2xl font-bold text-blue-900">{(ptaData?.totalPPEValuePercentage || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Archive className="w-4 h-4" /> Stock Status
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-700">{inStockCount.toLocaleString()}</p>
                  <p className="text-xs text-green-600 font-medium">In Stock</p>
                  <p className="text-[10px] text-green-500">Unassigned</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-700">{(assignedCount > 0 ? assignedCount : 0).toLocaleString()}</p>
                  <p className="text-xs text-blue-600 font-medium">Assigned</p>
                  <p className="text-[10px] text-blue-500">With movements</p>
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={stockData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={40} strokeWidth={2}>
                        <Cell fill="#22c55e" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {overview?.categoryBreakdown && overview.categoryBreakdown.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Category Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={overview.categoryBreakdown.map(c => ({ name: c.name, count: c.count }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={1}>
                        {overview.categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-2">
                    {overview.categoryBreakdown.map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="truncate text-slate-700">{cat.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900 ml-2">{cat.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Condition Breakdown */}
            {overview?.conditionBreakdown && overview.conditionBreakdown.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Condition Summary
                </h3>
                <div className="space-y-2">
                  {overview.conditionBreakdown.map((cond) => {
                    const pct = totalPPE > 0 ? (cond.count / totalPPE) * 100 : 0;
                    return (
                      <div key={cond.condition} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-28 truncate">{cond.condition}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-12 text-right">{cond.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
