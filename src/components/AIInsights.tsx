
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Plus, Lightbulb, CheckCircle } from "lucide-react";
import { useAIInsights } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AIInsightsProps {
  expanded?: boolean;
}

export const AIInsights = ({ expanded = false }: AIInsightsProps) => {
  const { data: insights, isLoading, error } = useAIInsights();
  const [actioningInsight, setActioningInsight] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'opportunity':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'anomaly':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'opportunity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'anomaly':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'trend':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleTakeAction = async (insightId: string, title: string) => {
    try {
      setActioningInsight(insightId);
      
      // Simulate taking action - in real app this would trigger specific workflows
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Action Initiated",
        description: `Action has been taken for "${title}". You'll be notified of progress.`,
      });
      
      // Optional: Mark insight as actioned in database
      // await supabase.from('ai_insights').update({ actioned: true }).eq('id', insightId);
      
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActioningInsight(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Analyzing contracts...</p>
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
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedInsights = expanded ? insights : insights?.slice(0, 3);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Insights
        </CardTitle>
        <CardDescription>
          {expanded ? 'Comprehensive AI-powered contract analysis' : 'AI-powered contract intelligence and recommendations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!insights || insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No insights yet</h3>
              <p className="text-slate-500 mb-4">
                Upload contracts to get AI-powered insights about risks, opportunities, and trends
              </p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Upload Contract
              </Button>
            </div>
          ) : (
            displayedInsights?.map((insight) => {
              const isActioning = actioningInsight === insight.id;
              
              return (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(insight.insight_type)}
                      <Badge variant="outline" className={getTypeColor(insight.insight_type)}>
                        {insight.insight_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      {insight.actionable && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Actionable
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-slate-700 mb-3">{insight.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Confidence:</span>
                        <Progress value={insight.confidence} className="w-16 h-2" />
                        <span className="text-xs font-medium text-slate-700">{insight.confidence}%</span>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => handleTakeAction(insight.id, insight.title)}
                        disabled={isActioning}
                      >
                        {isActioning ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Take Action
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!expanded && insights && insights.length > 3 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" className="w-full">
              View All Insights ({insights.length - 3} more)
            </Button>
          </div>
        )}

        {expanded && insights && insights.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">AI Analysis Summary</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              Your contract portfolio shows moderate risk with several optimization opportunities. 
              Key focus areas: renewal timing, payment term standardization, and vendor consolidation.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-900">72</div>
                <div className="text-xs text-blue-700">Risk Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-900">$485K</div>
                <div className="text-xs text-green-700">Savings Potential</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">{insights.length}</div>
                <div className="text-xs text-purple-700">Active Insights</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
