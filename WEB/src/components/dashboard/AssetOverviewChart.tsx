import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAssetOverview, DashboardAssetOverview } from '@/api/dashboard/dashboardApi';
import { toast } from 'sonner';

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

interface CategoryPieItem {
  name: string;
  value: number;
}

interface AssetOverviewChartProps {
  ppeCategoryData?: CategoryPieItem[];
  seCategoryData?: CategoryPieItem[];
  supplyCategoryData?: CategoryPieItem[];
}

export function AssetOverviewChart({ ppeCategoryData = [], seCategoryData = [], supplyCategoryData = [] }: AssetOverviewChartProps) {
  const [data, setData] = useState<DashboardAssetOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAssetOverview()
      .then(setData)
      .catch(() => toast.error('Failed to load asset overview'))
      .finally(() => setIsLoading(false));
  }, []);

  const ppeData = ppeCategoryData.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const seData = seCategoryData.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const supplyData = supplyCategoryData.map((c, i) => ({ ...c, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const UNSERVICEABLE_KEYWORDS = ['defective', 'unserviceable', 'not working', 'for disposal', 'damaged', 'broken'];
  const { serviceableCount, unserviceableCount } = (data?.conditionBreakdown ?? []).reduce(
    (acc, c) => {
      const condition = c.condition.toLowerCase();
      if (UNSERVICEABLE_KEYWORDS.some(keyword => condition.includes(keyword))) {
        acc.unserviceableCount += c.count;
      } else {
        acc.serviceableCount += c.count;
      }
      return acc;
    },
    { serviceableCount: 0, unserviceableCount: 0 }
  );
  const conditionTotal = serviceableCount + unserviceableCount;
  const serviceablePct = conditionTotal > 0 ? (serviceableCount / conditionTotal) * 100 : 0;
  const unserviceablePct = conditionTotal > 0 ? (unserviceableCount / conditionTotal) * 100 : 0;

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const list = item.payload?.data ?? [];
    const total = list.reduce((s: number, d: any) => s + (d.value ?? 0), 0);
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="text-sm">{item.name}: {item.value}</p>
        <p className="text-xs text-muted-foreground">{total ? ((item.value / total) * 100).toFixed(1) : 0}%</p>
      </div>
    );
  };

  const renderPieSection = (
    items: { name: string; value: number; color: string }[],
    emptyLabel: string
  ) => {
    if (items.length === 0) {
      return <p className="text-center text-muted-foreground py-16">{emptyLabel}</p>;
    }
    return (
      <div className="h-96 flex gap-6">
        <div className="w-[380px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={items} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label={false}>
                {items.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium flex-shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Asset Overview</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Overview</CardTitle>
        <CardDescription>Asset distribution analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ppe" className="space-y-4">
          <TabsList className="h-auto flex-wrap gap-1">
            <TabsTrigger value="ppe" className="flex-none px-3">PPE</TabsTrigger>
            <TabsTrigger value="se" className="flex-none px-3">Semi-Expendable</TabsTrigger>
            <TabsTrigger value="supply" className="flex-none px-3">Supply</TabsTrigger>
            <TabsTrigger value="condition" className="flex-none px-3">By Condition</TabsTrigger>
          </TabsList>

          {/* PPE by Category */}
          <TabsContent value="ppe" className="space-y-4">
            {renderPieSection(ppeData, 'No PPE category data available')}
          </TabsContent>

          {/* Semi-Expendable by Category */}
          <TabsContent value="se" className="space-y-4">
            {renderPieSection(seData, 'No Semi-Expendable category data available')}
          </TabsContent>

          {/* Supply by Category */}
          <TabsContent value="supply" className="space-y-4">
            {renderPieSection(supplyData, 'No supply category data available')}
          </TabsContent>

          {/* By Condition */}
          <TabsContent value="condition" className="space-y-4">
            {conditionTotal === 0 ? (
              <p className="text-center text-muted-foreground py-16">No condition data available</p>
            ) : (
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      <span className="text-sm font-medium">Serviceable</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{serviceableCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${serviceablePct}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Unserviceable</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{unserviceableCount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${unserviceablePct}%` }} />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}








