
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Notification {
  id: string;
  type: 'deadline' | 'renewal' | 'alert' | 'completion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'deadline',
    title: 'Contract Renewal Notice Due',
    message: 'Global Maritime Ltd contract requires 30-day notice in 12 days',
    timestamp: '2 hours ago',
    read: false,
    priority: 'high'
  },
  {
    id: '2',
    type: 'completion',
    title: 'Document Analysis Complete',
    message: 'AI analysis finished for "Equipment Lease Contract.pdf"',
    timestamp: '4 hours ago',
    read: false,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Payment Terms Anomaly',
    message: 'Unusual 45-day payment terms detected in TechEquip contract',
    timestamp: '1 day ago',
    read: true,
    priority: 'medium'
  },
  {
    id: '4',
    type: 'renewal',
    title: 'Contract Renewal Opportunity',
    message: 'CloudTech Inc contract eligible for early renewal with 10% discount',
    timestamp: '2 days ago',
    read: true,
    priority: 'low'
  }
];

export const NotificationPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'deadline':
        return <Calendar className="w-4 h-4 text-red-500" />;
      case 'renewal':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-2 hover:bg-slate-50 cursor-pointer transition-colors ${
                        getPriorityColor(notification.priority)
                      } ${!notification.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-1">
                            {notification.message}
                          </p>
                          <span className="text-xs text-slate-400">
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
