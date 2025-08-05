
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeadlineTimeline } from "@/components/DeadlineTimeline";
import { ArrowLeft, Calendar, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeadlines } from "@/hooks/useContracts";
import { differenceInDays, parseISO } from "date-fns";

const AllDeadlines = () => {
  const navigate = useNavigate();
  const { data: deadlines } = useDeadlines();

  const getUrgencyFromDays = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 7) return 'critical';
    if (daysRemaining <= 30) return 'high';
    if (daysRemaining <= 90) return 'medium';
    return 'low';
  };

  // Calculate statistics
  const stats = deadlines ? {
    total: deadlines.length,
    pending: deadlines.filter(d => d.status === 'pending').length,
    overdue: deadlines.filter(d => {
      const daysRemaining = differenceInDays(parseISO(d.due_date), new Date());
      return daysRemaining < 0 || d.status === 'overdue';
    }).length,
    critical: deadlines.filter(d => {
      const daysRemaining = differenceInDays(parseISO(d.due_date), new Date());
      return getUrgencyFromDays(daysRemaining) === 'critical' && d.status === 'pending';
    }).length,
    completed: deadlines.filter(d => d.status === 'completed').length
  } : { total: 0, pending: 0, overdue: 0, critical: 0, completed: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Timeline & Deadlines</h1>
          <p className="text-slate-600">Complete timeline of contract obligations and deadlines</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Deadlines</CardTitle>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Overdue</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Critical</CardTitle>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <DeadlineTimeline expanded={true} />
      </div>
    </div>
  );
};

export default AllDeadlines;
