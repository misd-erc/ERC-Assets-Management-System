import { Card, CardContent } from '@/components/ui/card';
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
  TrendingUp,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useData } from '@/hooks/data/useData';
import { AssetOverviewChart } from '@/components/dashboard/AssetOverviewChart';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
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
  const [seModalView, setSeModalView] = useState<'all' | 'issued' | 'stock'>('all');

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
  const ppeAmount = ptaData?.totalPPEValue || 0;
  const seIssued = ptaData?.totalSEIssued || 0;
  const seStock = ptaData?.totalSEStock || 0;
  const seIssuedValue = ptaData?.totalSEIssuedValue || 0;
  const seStockValue = ptaData?.totalSEStockValue || 0;

  const ppeCategoryPieData = (ptaData?.ppeCategoryBreakdown ?? []).map(c => ({ name: c.name, value: c.count }));
  const seCategoryPieData = (ptaData?.seCategoryBreakdown ?? []).map(c => ({ name: c.name, value: c.count }));

  const supplyCategoryPieData = (supplyStats?.categoryBreakdown ?? []).map(c => ({ name: c.name, value: c.itemCount }));

  const supplyStockHealthItems = supplyStats?.stockHealthItems ?? [];
  const supplyOutOfStockCount = supplyStockHealthItems.filter(i => i.stockOnHand === 0).length;
  const supplyLowStockCount = supplyStockHealthItems.filter(i => i.isLowStock && i.stockOnHand > 0).length;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pendingRequests = 47; // Awaiting approval
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const approvedRequests = 156; // Ready for processing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const disposedItems = 231; // Successfully disposed

  // Format currency in Philippine Peso
  const formatCurrency = (amount: number) => {
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
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{totalPPE.toLocaleString()} item/s</p>
            </div>
          </CardContent>
        </Card>

        {/* Semi-Expendable Card */}
        <Card
          className="hover:shadow-lg transition-all duration-200 border-2 border-green-200 cursor-pointer"
          onClick={() => { setSeModalView('all'); setActiveModal('se'); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSeModalView('all'); setActiveModal('se'); } }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Semi-Expendable Property</p>
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Total - prominent */}
            <div className="px-2 py-1 -mx-2">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(seIssuedValue + seStockValue)}</p>
                <span className="text-sm font-bold text-green-600">Total Value</span>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{(seIssued + seStock).toLocaleString()} item/s</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-2 grid grid-cols-2 gap-2">
              {/* Issued */}
              <div
                className="px-2 py-1 rounded-md hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); setSeModalView('issued'); setActiveModal('se'); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSeModalView('issued'); setActiveModal('se'); } }}
              >
                <span className="text-xs font-bold text-green-600 block mb-0.5">Issued</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(seIssuedValue)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{seIssued.toLocaleString()} item/s</p>
              </div>

              {/* On Stock */}
              <div
                className="px-2 py-1 rounded-md hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                onClick={(e) => { e.stopPropagation(); setSeModalView('stock'); setActiveModal('se'); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSeModalView('stock'); setActiveModal('se'); } }}
              >
                <span className="text-xs font-bold text-teal-600 block mb-0.5">InStock</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(seStockValue)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{seStock.toLocaleString()} item/s</p>
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
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{(supplyStats?.totalItems || 0).toLocaleString()} item/s</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 my-3" />

            <div className="grid grid-cols-3 gap-1 px-2 -mx-2 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-500">{(supplyStats?.sufficientStockCount || 0).toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">sufficient</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-amber-600">{supplyLowStockCount.toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">low stock</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-bold text-red-600">{supplyOutOfStockCount.toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">out of stock</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Overview Chart */}
      <AssetOverviewChart
        ppeCategoryData={ppeCategoryPieData}
        seCategoryData={seCategoryPieData}
        supplyCategoryData={supplyCategoryPieData}
      />

      {/* Recent Activities */}
      <RecentActivitiesCard />

      {/* KPI Detail Modals */}
      <PPEDetailModal open={activeModal === 'ppe'} onClose={() => setActiveModal(null)} ptaData={ptaData} formatCurrency={formatCurrency} />
      <SEDetailModal open={activeModal === 'se'} onClose={() => setActiveModal(null)} ptaData={ptaData} formatCurrency={formatCurrency} initialViewMode={seModalView} />
      <SupplyDetailModal open={activeModal === 'supply'} onClose={() => setActiveModal(null)} supplyStats={supplyStats} formatCurrency={formatCurrency} />
    </div>
  );
}

export default Dashboard;



