import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Package,
  CheckCircle,
  Clock,
  Trash2,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { RecentActivitiesCard } from '../components/dashboard/RecentActivitiesCard';
import { AssetOverviewChart } from '../components/dashboard/AssetOverviewChart';
import { PendingApprovalsCard } from '../components/dashboard/PendingApprovalsCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { useData } from '../hooks';

interface KPIData {
  title: string;
  value: string | number;
  description: string;
  changeType: 'positive' | 'negative' | 'neutral';
  change: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

interface DashboardProps {
  onNavigate?: (module: string) => void;
}

const kpiData: KPIData[] = [
  {
    title: 'Total Assets',
    value: '2',
    description: 'Active inventory items',
    changeType: 'neutral',
    change: 'Total count',
    icon: Package,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    title: 'Pending Requests',
    value: '1',
    description: 'Awaiting approval',
    changeType: 'negative',
    change: 'Needs attention',
    icon: Clock,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    title: 'Approved Requests',
    value: '0',
    description: 'Ready for processing',
    changeType: 'positive',
    change: 'Processing ready',
    icon: CheckCircle,
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    title: 'Disposed Items',
    value: '89',
    description: 'Successfully disposed',
    changeType: 'neutral',
    change: 'Completed',
    icon: Trash2,
    color: 'bg-red-50 text-red-600 border-red-200',
  },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-1">
            Welcome back, System Administrator. Monitor your asset management operations at a glance.
          </p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              className={`hover:shadow-lg transition-all duration-200 border-2 ${kpi.color.includes('border') ? kpi.color.split(' ').pop() : 'border-slate-200'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                      <div className={`p-2 rounded-lg ${kpi.color.split(' border')[0]}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</p>
                    <p className="text-xs text-slate-500 mb-2">{kpi.description}</p>
                    <div className="flex items-center">
                      {kpi.changeType === 'positive' && (
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" aria-hidden="true" />
                      )}
                      {kpi.changeType === 'negative' && (
                        <Activity className="w-3 h-3 text-red-600 mr-1" aria-hidden="true" />
                      )}
                      {kpi.changeType === 'neutral' && (
                        <Activity className="w-3 h-3 text-blue-600 mr-1" aria-hidden="true" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          kpi.changeType === 'positive'
                            ? 'text-green-600'
                            : kpi.changeType === 'negative'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Asset Overview and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetOverviewChart />
        <RecentActivitiesCard />
      </div>

      {/* Pending Approvals and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApprovalsCard />
        <QuickActionsCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
