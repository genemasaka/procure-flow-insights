
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, Plus } from "lucide-react";
import { useDeadlines } from "@/hooks/useContracts";
import { format, differenceInDays } from "date-fns";

interface DeadlineTimelineProps {
  expanded?: boolean;
}

export const DeadlineTimeline = ({ expanded = false }: DeadlineTimelineProps) => {
  const { data: deadlines, isLoading, error } = useDeadlines();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'renewal':
        return <Calendar className="w-4 h-4" />;
      case 'payment':
        return <Clock className="w-4 h-4" />;
      case 'notice':
        return <Bell className="w-4 h-4" />;
      case 'milestone':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 7) return 'text-red-600';
    if (daysRemaining <= 14) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading deadlines...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading deadlines</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedDeadlines = expanded ? deadlines : deadlines?.slice(0, 4);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>
          {expanded ? 'Complete timeline of contract obligations' : 'Critical dates requiring attention'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!deadlines || deadlines.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No deadlines yet</h3>
              <p className="text-slate-500 mb-4">
                Start adding contracts to track important dates and obligations
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Contract
              </Button>
            </div>
          ) : (
            displayedDeadlines?.map((deadline) => {
              const daysRemaining = differenceInDays(new Date(deadline.due_date), new Date());
              
              return (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-lg border-l-4 ${getPriorityColor(deadline.priority)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(deadline.type)}
                      <h4 className="font-semibold text-slate-900">{deadline.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityBadgeColor(deadline.priority)}>
                        {deadline.priority}
                      </Badge>
                      <span className={`text-sm font-medium ${getUrgencyColor(daysRemaining)}`}>
                        {daysRemaining} days
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">{deadline.contracts?.counterparty || 'No contract'}</span> • {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                  </div>
                  
                  {deadline.description && (
                    <p className="text-sm text-slate-700 mb-3">{deadline.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {daysRemaining <= 14 && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs text-slate-500">
                        Due {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Snooze
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Action
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!expanded && deadlines && deadlines.length > 4 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" className="w-full">
              View All Deadlines ({deadlines.length - 4} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
