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
  const activities: Activity[] = [
    {
      id: '1',
      type: 'issued',
      title: 'Office Supplies Issued',
      description: 'RIS-2024-156: 50 pcs bond paper, 10 pcs ballpen',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      status: 'completed'
    },
    {
      id: '2',
      type: 'transferred',
      title: 'Equipment Transfer',
      description: 'PTR-2024-089: 2 desktop computers from IT to Finance',
      user: 'Jane Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'pending'
    },
    {
      id: '3',
      type: 'created',
      title: 'PAR Generated',
      description: 'PAR-2024-245: Property acknowledgment for new laptops',
      user: 'Mike Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'completed'
    },
    {
      id: '4',
      type: 'returned',
      title: 'Equipment Returned',
      description: 'RRPE-2024-034: Projector returned from Training Room',
      user: 'Sarah Wilson',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: 'completed'
    },
    {
      id: '5',
      type: 'disposed',
      title: 'Asset Disposal',
      description: 'DISP-2024-012: Old CRT monitors disposed through auction',
      user: 'Admin User',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      status: 'completed'
    },
    {
      id: '6',
      type: 'issued',
      title: 'PPE Distribution',
      description: 'Safety helmets and vests issued to field team',
      user: 'Safety Officer',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'completed'
    }
  ];

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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'issued':
        return 'bg-blue-50 text-blue-600';
      case 'transferred':
        return 'bg-purple-50 text-purple-600';
      case 'returned':
        return 'bg-green-50 text-green-600';
      case 'created':
        return 'bg-indigo-50 text-indigo-600';
      case 'disposed':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
