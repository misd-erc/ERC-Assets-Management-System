// NotificationCenter.tsx
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Package, 
  ArrowRightLeft, 
  AlertTriangle, 
  Clock,
  Trash2,
  X
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'RIS Approval Required',
      message: 'RIS-2024-001 from Finance Department requires your approval',
      type: 'warning',
      category: 'Approval',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      actionRequired: true
    },
    {
      id: '2',
      title: 'PAR Generated Successfully',
      message: 'PAR-2024-015 has been generated and is ready for printing',
      type: 'success',
      category: 'Document',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    },
    {
      id: '3',
      title: 'Asset Transfer Completed',
      message: 'IT equipment transfer from IT to Finance has been completed',
      type: 'info',
      category: 'Transfer',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '4',
      title: 'Low Stock Alert',
      message: 'Office supplies inventory below minimum threshold',
      type: 'warning',
      category: 'Inventory',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true
    },
    {
      id: '5',
      title: 'System Maintenance Scheduled',
      message: 'System will undergo maintenance on Dec 15, 2024 from 10:00 PM to 2:00 AM',
      type: 'info',
      category: 'System',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    }
  ]);

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"}
        className={`${isMobile ? 'h-[85vh] rounded-t-2xl' : 'w-[400px] sm:w-[540px]'} p-0`}
      >
        <SheetHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b sticky top-0 bg-white dark:bg-slate-900 z-10">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                Mark all read
              </Button>
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm">
            Stay updated on asset management activities and system alerts
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-120px)] px-4 sm:px-6">
          <div className="space-y-3 sm:space-y-4 py-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type, notification.category);
                return (
                  <div key={notification.id}>
                    <div className={`p-3 sm:p-4 rounded-lg border transition-colors hover:bg-gray-50 relative ${
                      !notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
                    }`}>
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${getNotificationColor(notification.type)}`}>
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                            <h4 className={`text-xs sm:text-sm pr-6 ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-[9px] sm:text-xs">
                                  Action Required
                                </Badge>
                              )}
                              {!notification.read && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                            {notification.message}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[9px] sm:text-xs">
                              {notification.category}
                            </Badge>
                            <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-muted-foreground">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>
                          </div>
                          {notification.actionRequired && (
                            <div className="mt-3 flex space-x-2">
                              <Button size="sm" className="text-xs h-7 sm:h-8">
                                Review
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 sm:h-8">
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="absolute top-3 right-3 p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-3 sm:my-4" />}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}