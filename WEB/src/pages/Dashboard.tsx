import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from '@/components/ui/badge';
import {
  Package,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CheckCircle,
  Clock,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Trash2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useData } from '@/hooks/data/useData';
import { AssetOverviewChart } from '@/components/dashboard/AssetOverviewChart';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { PendingApprovalsCard } from '@/components/dashboard/PendingApprovalsCard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getDashboardSummary, DashboardSummary, getPTADashboard, PTADashboardData, getSupplyStats, DashboardSupplyStats } from '@/api/dashboard/dashboardApi';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PPEDetailModal } from '@/components/dashboard/modals/PPEDetailModal';
import { SEDetailModal } from '@/components/dashboard/modals/SEDetailModal';
import { SupplyDetailModal } from '@/components/dashboard/modals/SupplyDetailModal';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TotalAssetModal } from '@/components/dashboard/modals/TotalAssetModal';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DashboardProps {
}

type ChangeType = 'positive' | 'neutral';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { assets, supplies, risRequests, contracts } = useData();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ptaData, setPtaData] = useState<PTADashboardData | null>(null);
  const [supplyStats, setSupplyStats] = useState<DashboardSupplyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'ppe' | 'se' | 'supply' | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch PTA dashboard data
        const ptaDashboardData = await getPTADashboard();
        setPtaData(ptaDashboardData);

        // Fetch supply stats
        const supplyStatsData = await getSupplyStats();
        setSupplyStats(supplyStatsData);
        
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
  // Issued/On Stock split is unreliable on the backend for now, so show everything as
  // Issued (matching the SE total) and On Stock as 0 until that's fixed.
  const seIssued = totalSE;
  const seStock = 0;
  const seIssuedValue = seAmount;
  const seStockValue = 0;
  
  // Calculate totals
  const totalAssets = totalPPE + totalSE;
  const totalAmount = ppeAmount + seAmount;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pendingRequests = 47; // Awaiting approval
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const approvedRequests = 156; // Ready for processing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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


  if (isLoading) {
    return (
      <div className="p-2 pt-5 md:pt-20 space-y-6">
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
    <div className="p-2 pt-5 md:pt-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back, {user?.firstName || 'User'}. Monitor your asset management operations at a glance.
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border dark:border-slate-700">
          <Clock className="w-4 h-4 inline mr-1" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PPE Card */}
        <Card
          className="hover:shadow-lg transition-all duration-200 border-2 border-blue-200 cursor-pointer"
          onClick={() => setActiveModal('ppe')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveModal('ppe'); } }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Property, Plant & Equipment</p>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="px-2 py-1 -mx-2">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(ppeAmount)}</p>
                <span className="text-sm font-bold text-blue-600">Total Value</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{totalPPE.toLocaleString()} items</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Share of total assets</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{ppePercentage.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Semi-Expendable Card */}
        <Card
          className="hover:shadow-lg transition-all duration-200 border-2 border-green-200 cursor-pointer"
          onClick={() => setActiveModal('se')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveModal('se'); } }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Semi-Expendable Property</p>
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Issued */}
            <div className="px-2 py-1 -mx-2 mb-1">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(seIssuedValue)}</p>
                <span className="text-sm font-bold text-green-600">Issued</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{seIssued.toLocaleString()} items</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

            {/* In Stock */}
            <div className="px-2 py-1 -mx-2">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(seStockValue)}</p>
                <span className="text-sm font-bold text-teal-600">On Stock</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{seStock.toLocaleString()} items</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(seIssuedValue + seStockValue)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">/ {(seIssued + seStock).toLocaleString()} items</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply and Materials Card */}
        <Card
          className="hover:shadow-lg transition-all duration-200 border-2 border-amber-200 cursor-pointer"
          onClick={() => setActiveModal('supply')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveModal('supply'); } }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Supply and Materials</p>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="px-2 py-1 -mx-2">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(supplyStats?.totalValue || 0)}</p>
                <span className="text-sm font-bold text-amber-600">Total Value</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{(supplyStats?.totalQuantity || 0).toLocaleString()} qty</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

            <div className="flex items-center justify-between px-2 -mx-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-sm font-bold text-green-700 dark:text-green-500">{(supplyStats?.sufficientStockCount || 0).toLocaleString()}</span>
                <span className="text-xs text-slate-500">sufficient</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm font-bold text-amber-600">{(supplyStats?.lowStockCount || 0).toLocaleString()}</span>
                <span className="text-xs text-slate-500">low stock</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Value Breakdown Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Portfolio Summary</CardTitle>
          <CardDescription>
            Breakdown of total asset value of ₱{((totalAmount + (supplyStats?.totalValue || 0)) / 1000000).toFixed(2)}M (PPE, SE & Supply)
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

            {/* Supply Breakdown */}
            {(() => {
              const supplyValue = supplyStats?.totalValue || 0;
              const grandTotal = totalAmount + supplyValue;
              const supplyPct = grandTotal > 0 ? (supplyValue / grandTotal) * 100 : 0;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-medium">Supply Items</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(supplyValue)}</p>
                      <p className="text-xs text-slate-500">{(supplyStats?.totalQuantity || 0).toLocaleString()} qty</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${supplyPct.toFixed(1)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 text-right">
                    {supplyPct.toFixed(1)}% of total asset value
                  </p>
                </div>
              );
            })()}
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
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(totalAmount + (supplyStats?.totalValue || 0))}</p>
                <p className="text-xs text-indigo-600 font-medium">{(totalAssets + (supplyStats?.totalQuantity || 0)).toLocaleString()} total items</p>
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

      {/* KPI Detail Modals */}
      <PPEDetailModal open={activeModal === 'ppe'} onClose={() => setActiveModal(null)} ptaData={ptaData} formatCurrency={formatCurrency} />
      <SEDetailModal open={activeModal === 'se'} onClose={() => setActiveModal(null)} ptaData={ptaData} formatCurrency={formatCurrency} />
      <SupplyDetailModal open={activeModal === 'supply'} onClose={() => setActiveModal(null)} supplyStats={supplyStats} formatCurrency={formatCurrency} />
    </div>
  );
}

export default Dashboard;



