
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Calendar, Shield, DollarSign, FileText } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { calculateContractMetrics, formatCurrency } from "@/lib/contractUtils";

export const ContractMetrics = () => {
  const { data: contracts, isLoading, error } = useContracts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !contracts) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error loading metrics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = calculateContractMetrics(contracts);
  const riskScore = Math.max(0, 100 - (metrics.expiring * 10));

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Total Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{metrics.total}</div>
          {metrics.total > 0 ? (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Active portfolio</span>
            </div>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No contracts yet</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-600">{metrics.expiring}</div>
          <div className="flex items-center mt-2">
            <Calendar className="w-4 h-4 text-amber-500 mr-1" />
            <span className="text-sm text-amber-600">Next 30 days</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Active Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{metrics.active}</div>
          <div className="flex items-center mt-2">
            <Shield className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">
              {metrics.active > 0 ? 'Compliant' : 'Ready to start'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalValue)}</div>
          <Progress value={riskScore} className="mt-2" />
          <span className="text-sm text-slate-500 mt-1">Risk Score: {riskScore}</span>
        </CardContent>
      </Card>
    </div>
  );
};
