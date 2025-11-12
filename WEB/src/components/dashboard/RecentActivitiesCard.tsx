import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  Package,
  ArrowRightLeft,
  FileText,
  UserCheck,
  AlertTriangle,
  Clock,
  User
} from 'lucide-react';
import { useData } from '../../hooks';
import { getActivityColor, getStatusColor } from '../../utils/colorUtils';

interface Activity {
  id: string;
  type: 'issued' | 'transferred' | 'returned' | 'created' | 'disposed';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export function RecentActivitiesCard() {
  const { risRequests } = useData();

  const activities: Activity[] = useMemo(() => {
    return risRequests.map((request) => ({
      id: request.id,
      type: 'issued' as const,
      title: `RIS Request ${request.id}`,
      description: `Items: ${request.items.map(item => `${item.quantity} ${item.name}`).join(', ')}`,
      user: request.requester,
      timestamp: request.dateRequested,
      status: request.status as 'completed' | 'pending' | 'failed',
    }));
  }, [risRequests]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'issued':
        return Package;
      case 'transferred':
        return ArrowRightLeft;
      case 'returned':
        return ArrowRightLeft;
      case 'created':
        return FileText;
      case 'disposed':
        return AlertTriangle;
      default:
        return Package;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>
          Latest asset management operations and transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm">{activity.title}</p>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{activity.user}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <Button variant="outline" className="w-full mt-4" size="sm">
          View Activity Log
        </Button>
      </CardContent>
    </Card>
  );
}
