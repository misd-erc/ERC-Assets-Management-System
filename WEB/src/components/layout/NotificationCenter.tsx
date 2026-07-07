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
  X,
  ShieldCheck,
  Settings,
  FileText,
  Users,
  Loader2
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/store/notification';
import { MODULE_NAMES, SystemNotification } from '@/types/notification';
import { sendNotification } from '@/api/notification/notificationApi';
import { getAuthParams } from '@/utils/auth';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (module: string) => void;
}

export function NotificationCenter({ open, onOpenChange, onNavigate }: NotificationCenterProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useNotificationStore();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const getNotificationIcon = (title: string, moduleId: number | null) => {
    if (moduleId === 13) return ShieldCheck;     // Approvals
    if (moduleId === 8) return Trash2;           // Disposal
    if (moduleId === 7) return ArrowRightLeft;   // Transfers & Returns
    if (moduleId === 5) return Package;          // Delivery
    if (moduleId === 6) return Package;          // Supply Management
    if (moduleId === 14) return Users;           // User Management
    if (moduleId === 15) return Settings;        // Roles Management
    if (moduleId === 17) return Settings;        // System Settings
    if (moduleId === 12) return FileText;        // Reports Center

    const lower = title.toLowerCase();
    if (lower.includes('approval') || lower.includes('required')) return AlertTriangle;
    if (lower.includes('transfer')) return ArrowRightLeft;
    if (lower.includes('delivery') || lower.includes('supply') || lower.includes('stock')) return Package;
    if (lower.includes('account') || lower.includes('user')) return Users;
    return Bell;
  };

  const getNotificationColor = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('activated') || lower.includes('completed') || lower.includes('generated') || lower.includes('success'))
      return 'text-green-600 bg-green-50';
    if (lower.includes('required') || lower.includes('alert') || lower.includes('low') || lower.includes('suspended'))
      return 'text-amber-600 bg-amber-50';
    if (lower.includes('deactivated') || lower.includes('failed') || lower.includes('error') || lower.includes('rejected'))
      return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const isActionRequired = (title: string) => {
    const lower = title.toLowerCase();
    return lower.includes('required') || lower.includes('approval');
  };

  const getCategory = (moduleId: number | null, title: string): string => {
    if (moduleId && MODULE_NAMES[moduleId]) return MODULE_NAMES[moduleId];
    const lower = title.toLowerCase();
    if (lower.includes('account') || lower.includes('user')) return 'Account';
    if (lower.includes('system')) return 'System';
    return 'General';
  };

  const formatTimestamp = (dateStr: string) => {
    const timestamp = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [sending, setSending] = useState(false);

  const testNotifications = [
    { title: 'Low Stock Alert', description: 'Office supplies inventory below minimum threshold', moduleId: 6 },
    { title: 'Approval Required', description: 'RIS-2025-001 from Finance Department requires your approval', moduleId: 13 },
    { title: 'Asset Transfer Completed', description: 'IT equipment transfer from IT to Finance has been completed', moduleId: 7 },
    { title: 'Delivery Received', description: 'New delivery of office equipment has been received and logged', moduleId: 5 },
    { title: 'PAR Generated', description: 'PAR-2025-042 has been generated and is ready for printing', moduleId: 10 },
  ];

  const handleSendTestNotification = async () => {
    setSending(true);
    try {
      const { systemUserId } = getAuthParams();
      const randomNotif = testNotifications[Math.floor(Math.random() * testNotifications.length)];
      await sendNotification({
        title: randomNotif.title,
        description: randomNotif.description,
        recipientSystemUserId: systemUserId,
        moduleId: randomNotif.moduleId,
      });
      toast.success('Test notification sent!');
      fetchNotifications();
    } catch {
      toast.error('Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  // IAR notifications carry an actionType so a click can jump straight to where the IAR came from
  // (Delivery & Receipt) or, once approved, to the Asset Booking tab matching its item type(s).
  const handleNotificationClick = (notification: SystemNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionType === 'IAR_SUBMITTED' && notification.entityId) {
      sessionStorage.setItem('_notifNav', JSON.stringify({ iarId: notification.entityId }));
      onNavigate?.('delivery-receipt-items');
      onOpenChange(false);
    } else if (notification.actionType === 'IAR_APPROVED') {
      const label = (notification.entityLabel || '').toLowerCase();
      const tab = label.includes('supply') ? 'supply' : label.includes('ppe') ? 'ppe' : label.includes('se') ? 'se' : 'supply';
      sessionStorage.setItem('_notifNav', JSON.stringify({ tab }));
      onNavigate?.('asset-booking');
      onOpenChange(false);
    }
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
                variant="outline"
                size="sm"
                onClick={handleSendTestNotification}
                disabled={sending}
                className="text-xs h-8 sm:h-9 gap-1"
              >
                <Send className="w-3 h-3" />
                {sending ? 'Sending...' : 'Test'}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                >
                  Mark all read
                </Button>
              )}
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
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="w-8 h-8 text-gray-400 mb-3 animate-spin" />
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.title, notification.moduleId);
                const actionRequired = isActionRequired(notification.title);
                const category = getCategory(notification.moduleId, notification.title);
                return (
                  <div key={notification.id}>
                    <div
                      className={`p-3 sm:p-4 rounded-lg border transition-colors hover:bg-gray-50 relative cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${getNotificationColor(notification.title)}`}>
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                            <h4 className={`text-xs sm:text-sm pr-6 ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {actionRequired && (
                                <Badge variant="destructive" className="text-[9px] sm:text-xs">
                                  Action Required
                                </Badge>
                              )}
                              {!notification.isRead && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                            {notification.description}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[9px] sm:text-xs">
                              {category}
                            </Badge>
                            <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-muted-foreground">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span>{formatTimestamp(notification.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
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
