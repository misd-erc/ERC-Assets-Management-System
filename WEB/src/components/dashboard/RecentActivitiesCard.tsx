import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, ArrowRightLeft, FileText, AlertTriangle, Eye, User } from 'lucide-react';
import { getRecentActivities, DashboardRecentActivity } from '@/api/dashboard/dashboardApi';
import { toast } from 'sonner';

function getActivityMeta(action: string) {
  const a = (action ?? '').toLowerCase();
  if (a.includes('transfer')) return { icon: ArrowRightLeft, color: 'bg-purple-50 text-purple-600' };
  if (a.includes('return')) return { icon: ArrowRightLeft, color: 'bg-green-50 text-green-600' };
  if (a.includes('issu') || a.includes('assign') || a.includes('par') || a.includes('ics'))
    return { icon: Package, color: 'bg-blue-50 text-blue-600' };
  if (a.includes('creat') || a.includes('add') || a.includes('upload'))
    return { icon: FileText, color: 'bg-indigo-50 text-indigo-600' };
  if (a.includes('dispos') || a.includes('delete'))
    return { icon: AlertTriangle, color: 'bg-red-50 text-red-600' };
  return { icon: Eye, color: 'bg-gray-50 text-gray-600' };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentActivitiesCard() {
  const [activities, setActivities] = useState<DashboardRecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRecentActivities()
      .then(setActivities)
      .catch(() => toast.error('Failed to load recent activities'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest system actions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No recent activities</p>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2 pr-3">
              {activities.map((activity) => {
                const { icon: Icon, color } = getActivityMeta(activity.action ?? '');
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-full flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{activity.action}</p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-500 truncate">{activity.performedBy}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                      {activity.createdAt ? formatTimeAgo(activity.createdAt) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}












