import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../../hooks/data/useData';
import { formatCurrency, getStockStatus } from '../../utils/formatters';

export const CategoriesView = () => {
  const { supplies } = useData();

  const categories = [
    { name: 'Janitorial', icon: '🧹', color: 'bg-blue-50 border-blue-200' },
    { name: 'Accountable Forms', icon: '📋', color: 'bg-green-50 border-green-200' },
    { name: 'Electrical', icon: '⚡', color: 'bg-yellow-50 border-yellow-200' },
    { name: 'Office Supply', icon: '📎', color: 'bg-purple-50 border-purple-200' },
    { name: 'Other Office Supplies', icon: '📦', color: 'bg-gray-50 border-gray-200' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply Categories</CardTitle>
        <CardDescription>
          Browse supplies organized by category folders with automated tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const categorySupplies = supplies.filter(s =>
              s.name.toLowerCase().includes(category.name.toLowerCase())
            );
            const categoryValue = categorySupplies.reduce((sum, s) => sum + (s.quantity * (s.unitCost || 0)), 0);
            const lowStock = categorySupplies.filter(s => getStockStatus(s) === 'Low Stock').length;

            return (
              <div key={category.name} className={`border-2 ${category.color} rounded-lg overflow-hidden`}>
                <div className="p-4 cursor-pointer hover:bg-white/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{category.icon}</div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-slate-600">
                          {categorySupplies.length} items • {formatCurrency(categoryValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {lowStock > 0 && (
                        <Badge className="bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {lowStock} Low Stock
                        </Badge>
                      )}
                      <Badge className="bg-blue-100 text-blue-800">
                        Auto-tracked
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-t p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">Total Items</p>
                      <p className="font-medium">{categorySupplies.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Category Value</p>
                      <p className="font-medium">{formatCurrency(categoryValue)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">Stock Status</p>
                      <p className="font-medium text-green-600">
                        {categorySupplies.length - lowStock} Available
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Automated Features Active:</p>
                        <ul className="space-y-0.5 list-disc list-inside">
                          <li>Auto-generated consumption logs per department</li>
                          <li>Automated stock card entry with quantity balance</li>
                          <li>Real-time stock level monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
