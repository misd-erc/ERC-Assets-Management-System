import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, TrendingDown, FileText, BarChart3 } from 'lucide-react';
import { useData } from '../../hooks/data/useData';
import { formatCurrency, getStockStatus } from '../../utils/formatters';

export const SummaryCards = () => {
  const { supplies, risRequests } = useData();

  const totalItems = supplies.length;
  const lowStockItems = supplies.filter(s => getStockStatus(s) === 'Low Stock').length;
  const pendingRIS = risRequests.filter(r => r.status === 'pending').length;
  const totalInventoryValue = supplies.reduce((sum, s) => sum + (s.quantity * (s.unitCost || 0)), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Items</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{lowStockItems}</p>
            </div>
            {lowStockItems > 0 ? (
              <TrendingDown className="w-8 h-8 text-red-600" />
            ) : (
              <Badge className="bg-green-100 text-green-800">Good</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending RIS Requests</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{pendingRIS}</p>
            </div>
            <FileText className="w-8 h-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Inventory Value</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalInventoryValue)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
