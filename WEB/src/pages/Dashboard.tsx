import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CheckCircle,
  Clock,
  Trash2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useData } from '@/hooks/data/useData';
import { AssetOverviewChart } from '@/components/dashboard/AssetOverviewChart';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { PendingApprovalsCard } from '@/components/dashboard/PendingApprovalsCard';
import { getDashboardSummary, DashboardSummary, getPTADashboard, PTADashboardData } from '@/api/dashboard/dashboardApi';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface DashboardProps {
}

type ChangeType = 'positive' | 'neutral';

interface KPIMetric {
  title: string;
  value: string;
  count: string;
  description: string;
  changeType: ChangeType;
  change: string;
  icon: any;
  color: string;
}

function Dashboard() {
  const { user } = useAuth();
  const { assets, supplies, risRequests, contracts } = useData();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ptaData, setPtaData] = useState<PTADashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch PTA dashboard data
        const ptaDashboardData = await getPTADashboard();
        setPtaData(ptaDashboardData);
        
        // Optionally fetch summary data if needed
        // const summaryData = await getDashboardSummary();
        // setSummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Use PTA dashboard data or fallbacks
  const totalPPE = ptaData?.totalPPE || 0;
  const totalSE = ptaData?.totalSE || 0;
  const ppeAmount = ptaData?.totalPPEValue || 0;
  const seAmount = ptaData?.totalSEValue || 0;
  const ppePercentage = ptaData?.totalPPEValuePercentage || 0;
  const sePercentage = ptaData?.totalSEValuePercentage || 0;
  
  // Calculate totals
  const totalAssets = totalPPE + totalSE;
  const totalAmount = ppeAmount + seAmount;

  const pendingRequests = 47; // Awaiting approval
  const approvedRequests = 156; // Ready for processing
  const disposedItems = 231; // Successfully disposed

  // Format currency in Philippine Peso
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `\u20B1${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `\u20B1${(amount / 1000).toFixed(2)}K`;
    }
    return `\u20B1${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // TOR-required dashboard metrics with dynamic values
  const kpiData = [
    {
      title: 'PPE Total',
      value: formatCurrency(ppeAmount),
      count: `${totalPPE.toLocaleString()} items`,
      description: 'Property, Plant & Equipment',
      changeType: 'positive' as const,
      change: `${ppePercentage.toFixed(1)}% of total value`,
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'SE Total',
      value: formatCurrency(seAmount),
      count: `${totalSE.toLocaleString()} items`,
      description: 'Semi-Expendable Items',
      changeType: 'positive' as const,
      change: `${sePercentage.toFixed(1)}% of total value`,
      icon: Package,
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      title: 'Total Asset Value',
      value: formatCurrency(totalAmount),
      count: `${totalAssets.toLocaleString()} items`,
      description: 'Combined Assets Worth',
      changeType: 'positive' as const,
      change: 'PPE & SE Combined',
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 pt-20 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-1">
            Welcome back, {user?.firstName || 'User'}. Monitor your asset management operations at a glance.
          </p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
          <Clock className="w-4 h-4 inline mr-1" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards - Enhanced Grid with Amounts in â‚± */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className={`hover:shadow-lg transition-all duration-200 border-2 ${kpi.color.includes('border') ? kpi.color.split(' ').pop() : 'border-slate-200'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                    <div className={`p-2 rounded-lg ${kpi.color.split(' border')[0]}`}>
                      <kpi.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</p>
                  <p className="text-xs text-slate-600 font-medium mb-1">{kpi.count}</p>
                  <p className="text-xs text-slate-500 mb-2">{kpi.description}</p>
                  <div className="flex items-center">
                    <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-600">
                      {kpi.change}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Value Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Portfolio Summary</CardTitle>
          <CardDescription>
            Breakdown of total asset value of \u20B1{(totalAmount / 1000000).toFixed(2)}M (PPE & SE)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* PPE Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-medium">Property, Plant & Equipment (PPE)</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(ppeAmount)}</p>
                  <p className="text-xs text-slate-500">{totalPPE.toLocaleString()} items</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${totalAmount > 0 ? ppePercentage.toFixed(1) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-600 text-right">
                {ppePercentage.toFixed(1)}% of total asset value
              </p>
            </div>

            {/* SE Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-sm font-medium">Semi-Expendables (SE)</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(seAmount)}</p>
                  <p className="text-xs text-slate-500">{totalSE.toLocaleString()} items</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${totalAmount > 0 ? sePercentage.toFixed(1) : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-600 text-right">
                {sePercentage.toFixed(1)}% of total asset value
              </p>
            </div>
          </div>

          {/* Total Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Asset Portfolio</p>
                  <p className="text-xs text-slate-500">All categories combined</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(totalAmount)}</p>
                <p className="text-xs text-indigo-600 font-medium">{totalAssets.toLocaleString()} total items</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Overview Chart */}
      <AssetOverviewChart />

      {/* Recent Activities & Disposal Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivitiesCard />
        <PendingApprovalsCard />
      </div>
    </div>
  );
}

export default Dashboard;



