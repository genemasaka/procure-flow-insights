
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Calendar, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useDeadlines } from "@/hooks/useContracts";
import { differenceInDays, format } from "date-fns";

export const NotificationPanel = () => {
  const { data: deadlines } = useDeadlines();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Create notifications from deadlines
  const notifications = deadlines?.map(deadline => {
    const daysRemaining = differenceInDays(new Date(deadline.due_date), new Date());
    let type: 'deadline' | 'renewal' | 'risk' | 'milestone' = 'deadline';
    
    if (deadline.type === 'renewal') type = 'renewal';
    else if (deadline.type === 'milestone') type = 'milestone';
    else if (daysRemaining <= 7) type = 'risk';

    return {
      id: deadline.id,
      type,
      title: deadline.title,
      message: deadline.description || `${deadline.title} due in ${daysRemaining} days`,
      time: daysRemaining <= 0 ? 'Overdue' : `${daysRemaining} days`,
      read: readNotifications.has(deadline.id),
      daysRemaining
    };
  }).filter(n => n.daysRemaining <= 30) || []; // Only show notifications for next 30 days

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'renewal':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'milestone':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white shadow-lg border-0">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No notifications</p>
            <p className="text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer hover:bg-slate-50 ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium text-sm ${
                        !notification.read ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className={`text-xs ${
                      notification.daysRemaining <= 0 ? 'text-red-500 font-medium' :
                      notification.daysRemaining <= 7 ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                      {notification.time}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
