import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, Plus, Timer, Search, Filter, Eye, RotateCcw, FileText } from "lucide-react";
import { useDeadlines } from "@/hooks/useContracts";
import { format, differenceInDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

interface DeadlineTimelineProps {
  expanded?: boolean;
  onAddContract?: () => void;
}

export const DeadlineTimeline = ({ expanded = false, onAddContract }: DeadlineTimelineProps) => {
  const { data: deadlines, isLoading, error } = useDeadlines();
  const [actioningDeadline, setActioningDeadline] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'renewal_notice':
        return <Bell className="w-4 h-4" />;
      case 'expiration':
        return <Calendar className="w-4 h-4" />;
      case 'review':
        return <CheckCircle className="w-4 h-4" />;
      case 'payment':
        return <Clock className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string, status: string) => {
    if (status === 'overdue') return 'border-red-500 bg-red-100';
    
    switch (priority) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string, status: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (daysRemaining: number, status: string) => {
    if (status === 'overdue' || daysRemaining < 0) return 'text-red-600 font-bold';
    if (daysRemaining <= 7) return 'text-red-600';
    if (daysRemaining <= 30) return 'text-orange-600';
    if (daysRemaining <= 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyFromDays = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'critical';
    if (daysRemaining <= 30) return 'high';
    if (daysRemaining <= 90) return 'medium';
    return 'low';
  };

  const handleSnooze = async (deadlineId: string) => {
    try {
      setActioningDeadline(deadlineId);
      
      // Snooze for 7 days
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      
      const { error } = await supabase
        .from('deadlines')
        .update({ 
          due_date: newDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', deadlineId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      
      toast({
        title: "Deadline Snoozed",
        description: "Deadline has been postponed by 7 days.",
      });
    } catch (error) {
      console.error('Snooze error:', error);
      toast({
        title: "Error",
        description: "Failed to snooze deadline. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActioningDeadline(null);
    }
  };

  const handleAction = async (deadlineId: string, title: string) => {
    try {
      setActioningDeadline(deadlineId);
      
      // Mark as completed
      const { error } = await supabase
        .from('deadlines')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', deadlineId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      
      toast({
        title: "Action Completed",
        description: `"${title}" has been marked as completed.`,
      });
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActioningDeadline(null);
    }
  };

  const handleAddContract = () => {
    if (onAddContract) {
      onAddContract();
    } else {
      // Fallback: navigate to the dashboard and then switch to upload tab
      window.location.href = '/#upload';
    }
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

  // Filter and search deadlines
  const filteredDeadlines = deadlines?.filter(deadline => {
    // Status filter
    if (statusFilter !== 'all' && deadline.status !== statusFilter) return false;
    
    // Search filter
    if (searchTerm && !deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !deadline.contracts?.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !deadline.contracts?.counterparty?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== 'all' && deadline.type !== typeFilter) return false;
    
    // Urgency filter
    if (urgencyFilter !== 'all') {
      const daysRemaining = differenceInDays(parseISO(deadline.due_date), new Date());
      const urgency = getUrgencyFromDays(daysRemaining);
      if (urgency !== urgencyFilter) return false;
    }
    
    return true;
  }) || [];

  // Sort by due date (ascending)
  const sortedDeadlines = filteredDeadlines.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const displayedDeadlines = expanded ? sortedDeadlines : sortedDeadlines.slice(0, 4);
  
  // For the dashboard, show only pending/overdue
  const dashboardDeadlines = expanded ? displayedDeadlines : 
    displayedDeadlines.filter(deadline => deadline.status === 'pending' || deadline.status === 'overdue');

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {expanded ? 'Deadline Timeline' : 'Upcoming Deadlines'}
          {expanded && (
            <Badge variant="outline" className="ml-auto">
              {filteredDeadlines.length} total
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {expanded ? 'Complete timeline of contract obligations' : 'Critical dates requiring attention'}
        </CardDescription>
        
        {expanded && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts or counterparty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expiration">Expiration</SelectItem>
                  <SelectItem value="renewal_notice">Renewal Notice</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(expanded ? displayedDeadlines : dashboardDeadlines).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No pending deadlines</h3>
              <p className="text-slate-500 mb-4">
                All deadlines are up to date. Upload contracts to track important dates.
              </p>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleAddContract}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contract
              </Button>
            </div>
          ) : (
            (expanded ? displayedDeadlines : dashboardDeadlines).map((deadline) => {
              const daysRemaining = differenceInDays(parseISO(deadline.due_date), new Date());
              const isActioning = actioningDeadline === deadline.id;
              const urgencyLevel = getUrgencyFromDays(daysRemaining);
              
              return (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-lg border-l-4 ${getPriorityColor(deadline.priority, deadline.status)} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(deadline.type)}
                      <h4 className="font-semibold text-slate-900">{deadline.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityBadgeColor(deadline.priority, deadline.status)}>
                        {deadline.status === 'overdue' ? 'Overdue' : deadline.priority}
                      </Badge>
                      <span className={`text-sm font-medium ${getUrgencyColor(daysRemaining, deadline.status)}`}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 
                         daysRemaining === 0 ? 'Due today' : `${daysRemaining} days`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-600 mb-2">
                    <span className="font-medium">{deadline.contracts?.title || 'No contract title'}</span>
                    {deadline.contracts?.counterparty && (
                      <span> • {deadline.contracts.counterparty}</span>
                    )}
                    <span> • {format(parseISO(deadline.due_date), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {deadline.description && (
                    <p className="text-sm text-slate-700 mb-3">{deadline.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {urgencyLevel === 'critical' || urgencyLevel === 'overdue' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : urgencyLevel === 'high' ? (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      ) : null}
                      <span className="text-xs text-slate-500">
                        Type: {deadline.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {deadline.contract_id && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/contracts/${deadline.contract_id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      {deadline.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSnooze(deadline.id)}
                            disabled={isActioning}
                          >
                            <Timer className="w-4 h-4 mr-1" />
                            Snooze
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => handleAction(deadline.id, deadline.title)}
                            disabled={isActioning}
                          >
                            {isActioning ? 'Processing...' : 'Complete'}
                          </Button>
                        </>
                      )}
                      {deadline.status === 'completed' && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!expanded && filteredDeadlines.filter(d => d.status === 'pending' || d.status === 'overdue').length > 4 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/deadlines')}
            >
              View All Deadlines ({filteredDeadlines.filter(d => d.status === 'pending' || d.status === 'overdue').length - 4} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
