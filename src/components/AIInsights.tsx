import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, Target, Zap, Plus, Lightbulb, CheckCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useAIInsights } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from 'react-router-dom';

interface AIInsightsProps {
  expanded?: boolean;
}

export const AIInsights = ({ expanded = false }: AIInsightsProps) => {
  const { data: insights, isLoading, error } = useAIInsights();
  const [actioningInsight, setActioningInsight] = useState<string | null>(null);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      
      // Mark insight as actioned in database
      const { error } = await supabase
        .from('ai_insights')
        .update({ actionable: false })
        .eq('id', insightId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ai_insights'] });
      
      toast({
        title: "Action Completed",
        description: `Action has been taken for "${title}".`,
      });
      
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActioningInsight(null);
    }
  };

  // Group insights by contract
  const groupedInsights = insights?.reduce((acc, insight) => {
    const contractId = insight.contract_id;
    if (!acc[contractId]) {
      acc[contractId] = {
        contract: insight.contracts,
        insights: []
      };
    }
    acc[contractId].insights.push(insight);
    return acc;
  }, {} as Record<string, { contract: any; insights: any[] }>);

  // Helper to extract a brief summary from the description or a summary field
  const getInsightSummary = (insight: any) => {
    // If a summary field exists, use it; otherwise, parse description for key points
    if (insight.summary) return insight.summary;
    if (insight.description) {
      // Try to extract sentences with key info
      const match = insight.description.match(/(risk|opportunit|deadline|missing|term|renewal|value|amount|currency|counterparty|date|status|review|clause|payment|compliance|alert|action)/i);
      if (match) {
        // Return the sentence containing the keyword
        const sentences = insight.description.split('. ');
        const found = sentences.find(s => match[0] && s.toLowerCase().includes(match[0].toLowerCase()));
        return found ? found + '.' : sentences[0];
      }
      // Fallback: first sentence
      return insight.description.split('. ')[0] + '.';
    }
    return 'No summary available.';
  };

  const toggleContractExpansion = (contractId: string) => {
    const newExpanded = new Set(expandedContracts);
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId);
    } else {
      newExpanded.add(contractId);
    }
    setExpandedContracts(newExpanded);
  };

  const getContractInsightsSummary = (contractInsights: any[]) => {
    const riskCount = contractInsights.filter(i => i.insight_type === 'risk').length;
    const opportunityCount = contractInsights.filter(i => i.insight_type === 'opportunity').length;
    const highImpactCount = contractInsights.filter(i => i.impact === 'high').length;
    
    return { riskCount, opportunityCount, highImpactCount, total: contractInsights.length };
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

  const contractEntries = groupedInsights ? Object.entries(groupedInsights) : [];
  const displayedContracts = expanded ? contractEntries : contractEntries.slice(0, 3);

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
            </div>
          ) : (
            displayedContracts.map(([contractId, { contract, insights: contractInsights }]) => {
              const isExpanded = expandedContracts.has(contractId);
              const summary = getContractInsightsSummary(contractInsights);
              const highestImpactInsight = contractInsights.reduce((highest, current) => {
                const impactOrder = { high: 3, medium: 2, low: 1 };
                return impactOrder[current.impact] > impactOrder[highest.impact] ? current : highest;
              }, contractInsights[0]);
              
              return (
                <Card key={contractId} className="border border-slate-200 bg-slate-50/30">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleContractExpansion(contractId)}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-600" />
                            <div>
                              <h3 className="font-semibold text-slate-900">{contract?.title || 'Unknown Contract'}</h3>
                              <p className="text-sm text-slate-600">{contract?.counterparty || 'Unknown Counterparty'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {summary.riskCount > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  {summary.riskCount} Risk{summary.riskCount > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {summary.opportunityCount > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {summary.opportunityCount} Opportunity{summary.opportunityCount > 1 ? 's' : ''}
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {summary.total} Total
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </div>
                        
                        {!isExpanded && (
                          <div className="mt-3 pl-8">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(highestImpactInsight.insight_type)}
                              <Badge variant="outline" className={getTypeColor(highestImpactInsight.insight_type)}>
                                {highestImpactInsight.insight_type}
                              </Badge>
                              <span className={`text-sm font-medium ${getImpactColor(highestImpactInsight.impact)}`}>
                                {highestImpactInsight.impact} impact
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium">{highestImpactInsight.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{getInsightSummary(highestImpactInsight)}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-slate-200">
                        <div className="space-y-3 mt-4">
                          {contractInsights.map((insight) => {
                            const isActioning = actioningInsight === insight.id;
                            
                            return (
                              <div
                                key={insight.id}
                                className="p-3 rounded-lg border border-slate-200 bg-white"
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
                                <p className="text-sm text-slate-700 mb-2 font-medium">{getInsightSummary(insight)}</p>
                                <p className="text-xs text-slate-500 mb-3">{insight.description}</p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500">Confidence:</span>
                                      <Progress value={insight.confidence} className="w-16 h-2" />
                                      <span className="text-xs font-medium text-slate-700">{insight.confidence}%</span>
                                    </div>
                                  </div>
                                  {insight.actionable && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                          disabled={isActioning}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Take Action
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigate(`/contracts/${insight.contract_id}`)}>
                                          View Contract Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/contracts/${insight.contract_id}/edit`)}>
                                          Edit Contract
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/contracts/${insight.contract_id}/edit#deadlines`)}>
                                          Add/Edit Deadline
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleTakeAction(insight.id, insight.title)}>
                                          Mark as Reviewed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.open(`/api/contracts/${insight.contract_id}/download`, '_blank')}>
                                          Download Contract
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => alert('Notify stakeholders feature coming soon!')}>
                                          Notify Stakeholders
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>

        {!expanded && contractEntries.length > 3 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/insights'}
            >
              View All Contracts ({contractEntries.length - 3} more)
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
