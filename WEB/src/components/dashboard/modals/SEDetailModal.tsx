import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Package, Archive, Table2 } from 'lucide-react';
import { PTADashboardData } from '@/api/dashboard/dashboardApi';
import { listSePpeItemsNoMovement, PtaItem } from '@/api/asset/ptaMovementApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
  ptaData: PTADashboardData | null;
  formatCurrency: (amount: number) => string;
}

export function SEDetailModal({ open, onClose, ptaData, formatCurrency }: Props) {
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
  const inStockCount = inStockItems.length;
  const assignedCount = Math.max(totalSE - inStockCount, 0);

  const stockData = [
    { name: 'In Stock', value: inStockCount },
    { name: 'Assigned', value: assignedCount },
  ];

  const categoryGroups = inStockItems.reduce<Record<string, number>>((acc, item) => {
    const cat = item.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryList = Object.entries(categoryGroups)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <Package className="w-5 h-5" />
            </div>
            Semi-Expendable Asset Summary
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(ptaData?.totalSEValue || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-green-900">{totalSE.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Portfolio Share</p>
                  <p className="text-2xl font-bold text-green-900">{(ptaData?.totalSEValuePercentage || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Archive className="w-4 h-4" /> Stock Status
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-emerald-700">{inStockCount.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-medium">In Stock</p>
                  <p className="text-[10px] text-emerald-500">No movements yet</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-700">{assignedCount.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 font-medium">Assigned</p>
                  <p className="text-[10px] text-blue-500">Issued to employees</p>
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={stockData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={40} strokeWidth={2}>
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip formatter={(val: number) => val.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* In-Stock Items Table */}
            {inStockItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Table2 className="w-4 h-4" /> Available SE Items
                  <span className="text-xs font-normal text-slate-500">({inStockCount} items ready for issuance)</span>
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-slate-600">Property No.</th>
                          <th className="text-left p-2 font-semibold text-slate-600">Description</th>
                          <th className="text-left p-2 font-semibold text-slate-600">Category</th>
                          <th className="text-left p-2 font-semibold text-slate-600">Brand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inStockItems.slice(0, 20).map((item) => (
                          <tr key={item.id} className="border-t border-slate-100 hover:bg-green-50/50">
                            <td className="p-2 text-slate-800 font-medium">{item.propertyNumber || '-'}</td>
                            <td className="p-2 text-slate-600 max-w-[200px] truncate">{item.description}</td>
                            <td className="p-2 text-slate-600 truncate">{item.category || '-'}</td>
                            <td className="p-2 text-slate-600">{item.brand || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {inStockCount > 20 && (
                    <div className="bg-slate-50 text-center py-2 text-xs text-slate-500 border-t">
                      Showing 20 of {inStockCount.toLocaleString()} items
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category Summary of In-Stock Items */}
            {categoryList.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">In-Stock by Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categoryList.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-700 truncate">{cat.name}</span>
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full ml-2">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
