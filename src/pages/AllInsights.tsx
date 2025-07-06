
import { Button } from "@/components/ui/button";
import { AIInsights } from "@/components/AIInsights";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AllInsights = () => {
  const navigate = useNavigate();

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Insights</h1>
          <p className="text-slate-600">Comprehensive AI-powered contract analysis and recommendations</p>
        </div>
        <AIInsights expanded={true} />
      </div>
    </div>
  );
};

export default AllInsights;
