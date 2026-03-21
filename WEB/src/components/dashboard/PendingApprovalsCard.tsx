import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Trash2, XCircle } from 'lucide-react';
import { getDisposalStats, DashboardDisposalStats } from '@/api/dashboard/dashboardApi';
import { toast } from 'sonner';

interface StatItem {
  label: string;
  count: number;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
}

export function PendingApprovalsCard() {
  const [stats, setStats] = useState<DashboardDisposalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDisposalStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load disposal stats'))
      .finally(() => setIsLoading(false));
  }, []);

  const items: StatItem[] = stats
    ? [
        { label: 'Pending', count: stats.pendingCount, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        { label: 'Approved', count: stats.approvedCount, icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        { label: 'Disposed', count: stats.disposedCount, icon: Trash2, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
        { label: 'Rejected', count: stats.rejectedCount, icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      ]
    : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Disposal Overview</CardTitle>
        <CardDescription>
          {stats ? `${stats.totalCount} total disposal request${stats.totalCount !== 1 ? 's' : ''}` : 'Disposal request summary'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map(({ label, count, icon: Icon, bg, text, border }) => (
              <div key={label} className={`flex flex-col items-center justify-center p-5 rounded-xl border ${bg} ${border}`}>
                <Icon className={`w-6 h-6 mb-2 ${text}`} />
                <span className={`text-3xl font-bold ${text}`}>{count}</span>
                <span className={`text-xs font-medium mt-1 ${text} opacity-80`}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


















