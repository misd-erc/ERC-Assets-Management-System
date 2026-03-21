import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getAssetOverview, DashboardAssetOverview } from '@/api/dashboard/dashboardApi';
import { toast } from 'sonner';

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

export function AssetOverviewChart() {
  const [data, setData] = useState<DashboardAssetOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAssetOverview()
      .then(setData)
      .catch(() => toast.error('Failed to load asset overview'))
      .finally(() => setIsLoading(false));
  }, []);

  const categoryData = (data?.categoryBreakdown ?? []).map((c, i) => ({
    name: c.name,
    value: c.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const conditionData = (data?.conditionBreakdown ?? []).map((c, i) => ({
    name: c.condition,
    value: c.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="text-sm mb-2 font-medium">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

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
        <CardDescription>Asset activity trends and distribution analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity Trends</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="condition">By Condition</TabsTrigger>
          </TabsList>

          {/* Activity Trends */}
          <TabsContent value="activity" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyMovements ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="issued" name="Issued" fill="#3b82f6" radius={[2,2,0,0]} />
                  <Bar dataKey="transferred" name="Transferred" fill="#f59e0b" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-blue-500 rounded" /><span>Issued</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-amber-500 rounded" /><span>Transferred</span></div>
            </div>
          </TabsContent>

          {/* By Category */}
          <TabsContent value="categories" className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No category data available</p>
            ) : (
              <div className="h-80 flex">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={false}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-52 space-y-2 pl-4 overflow-y-auto">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* By Condition */}
          <TabsContent value="condition" className="space-y-4">
            {conditionData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">No condition data available</p>
            ) : (
              <div className="h-80 flex">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={false}>
                        {conditionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-52 space-y-2 pl-4 overflow-y-auto">
                  {conditionData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}








