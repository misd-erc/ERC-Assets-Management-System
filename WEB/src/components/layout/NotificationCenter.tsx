import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Bell, 
  Package, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: string;
  timestamp: Date;
  read: boolean;
  actionRequired?: boolean;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  // Mock notifications
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'RIS Approval Required',
      message: 'RIS-2024-001 from Finance Department requires your approval',
      type: 'warning',
      category: 'Approval',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      actionRequired: true
    },
    {
      id: '2',
      title: 'PAR Generated Successfully',
      message: 'PAR-2024-015 has been generated and is ready for printing',
      type: 'success',
      category: 'Document',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: '3',
      title: 'Asset Transfer Completed',
      message: 'IT equipment transfer from IT to Finance has been completed',
      type: 'info',
      category: 'Transfer',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true
    },
    {
      id: '4',
      title: 'Low Stock Alert',
      message: 'Office supplies inventory below minimum threshold',
      type: 'warning',
      category: 'Inventory',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true
    },
    {
      id: '5',
      title: 'System Maintenance Scheduled',
      message: 'System will undergo maintenance on Dec 15, 2024 from 10:00 PM to 2:00 AM',
      type: 'info',
      category: 'System',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true
    }
  ];

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'Transfer':
        return ArrowRightLeft;
      case 'Document':
        return Package;
      case 'Inventory':
        return Package;
      case 'Approval':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Mark all read
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </SheetTitle>
          <SheetDescription>
            Stay updated on asset management activities and system alerts
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type, notification.category);
              return (
                <div key={notification.id}>
                  <div className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {notification.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {notification.category}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(notification.timestamp)}</span>
                          </div>
                        </div>
                        {notification.actionRequired && (
                          <div className="mt-3 flex space-x-2">
                            <Button size="sm" className="text-xs">
                              Review
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-4" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
