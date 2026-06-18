import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingUp, Package, PackageOpen, BarChart3 } from 'lucide-react';
import { getAssetOverview, DashboardAssetOverview, PTADashboardData, DashboardSupplyStats } from '@/api/dashboard/dashboardApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  supplyStats: DashboardSupplyStats | null;
  formatCurrency: (amount: number) => string;
}

export function TotalAssetModal({ open, onClose, ptaData, supplyStats, formatCurrency }: Props) {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<DashboardAssetOverview | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAssetOverview()
      .then(setOverview)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open]);

  const ppeValue = ptaData?.totalPPEValue || 0;
  const seValue = ptaData?.totalSEValue || 0;
  const supplyValue = supplyStats?.totalValue || 0;
  const grandTotal = ppeValue + seValue + supplyValue;
  const totalItems = (ptaData?.totalPPE || 0) + (ptaData?.totalSE || 0) + (supplyStats?.totalItems || 0);

  const distributionData = [
    { name: 'PPE', value: ppeValue },
    { name: 'SE', value: seValue },
    { name: 'Supply', value: supplyValue },
  ];
  const DIST_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const pctOf = (val: number) => grandTotal > 0 ? ((val / grandTotal) * 100).toFixed(1) : '0.0';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            Total Asset Overview
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-xl p-6 text-center">
              <p className="text-sm text-indigo-600 font-medium">Combined Asset Value</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">{formatCurrency(grandTotal)}</p>
              <p className="text-sm text-indigo-500 mt-1">{totalItems.toLocaleString()} total items across all categories</p>
            </div>

            {/* Value Distribution */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Value Distribution</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={distributionData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {distributionData.map((_, i) => (
                          <Cell key={i} fill={DIST_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-2">
                  {distributionData.map((seg, i) => (
                    <div key={seg.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DIST_COLORS[i] }} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700">{seg.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(seg.value)} · {pctOf(seg.value)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-blue-600 font-medium">PPE</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(ppeValue)}</p>
                <p className="text-[11px] text-blue-600">{(ptaData?.totalPPE || 0).toLocaleString()} items</p>
                <p className="text-[10px] text-blue-500 mt-0.5">{pctOf(ppeValue)}% of total</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <Package className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600 font-medium">SE</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(seValue)}</p>
                <p className="text-[11px] text-green-600">{(ptaData?.totalSE || 0).toLocaleString()} items</p>
                <p className="text-[10px] text-green-500 mt-0.5">{pctOf(seValue)}% of total</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <PackageOpen className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-amber-600 font-medium">Supply</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(supplyValue)}</p>
                <p className="text-[11px] text-amber-600">{(supplyStats?.totalItems || 0).toLocaleString()} items</p>
                <p className="text-[10px] text-amber-500 mt-0.5">{pctOf(supplyValue)}% of total</p>
              </div>
            </div>

            {/* Activity Trends */}
            {overview?.monthlyMovements && overview.monthlyMovements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Activity Trends (Last 6 Months)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={overview.monthlyMovements}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="issued" name="Issued" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="transferred" name="Transferred" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
