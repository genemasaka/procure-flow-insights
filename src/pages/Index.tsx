
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ContractLibrary } from "@/components/ContractLibrary";
import { DeadlineTimeline } from "@/components/DeadlineTimeline";
import { AIInsights } from "@/components/AIInsights";
import { NotificationPanel } from "@/components/NotificationPanel";
import { FileText, Calendar, Brain, Bell, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data for demonstration
  const contractStats = {
    total: 47,
    expiringSoon: 8,
    active: 39,
    riskScore: 72
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  ProcureFlow
                </h1>
                <p className="text-sm text-slate-500">Contract Management System</p>
              </div>
            </div>
            <NotificationPanel />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{contractStats.total}</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{contractStats.expiringSoon}</div>
              <div className="flex items-center mt-2">
                <Calendar className="w-4 h-4 text-amber-500 mr-1" />
                <span className="text-sm text-amber-600">Next 30 days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{contractStats.active}</div>
              <div className="flex items-center mt-2">
                <Shield className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Compliant</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{contractStats.riskScore}</div>
              <Progress value={contractStats.riskScore} className="mt-2" />
              <span className="text-sm text-slate-500 mt-1">Portfolio health</span>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DeadlineTimeline />
              <AIInsights />
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="library">
            <ContractLibrary />
          </TabsContent>

          <TabsContent value="timeline">
            <DeadlineTimeline expanded={true} />
          </TabsContent>

          <TabsContent value="insights">
            <AIInsights expanded={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
