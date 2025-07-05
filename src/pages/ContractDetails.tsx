
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, FileText, Calendar, DollarSign, User, Edit, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: string;
  title: string;
  counterparty: string;
  contract_type: string;
  status: string;
  contract_value: number | null;
  currency: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  file_name: string | null;
  renewal_notice_days: number | null;
  created_at: string;
}

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error fetching contract details:', error);
      toast({
        title: "Error",
        description: "Failed to load contract details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">Contract Not Found</h2>
          <p className="text-slate-500 mb-4">The contract you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{contract.title}</h1>
              <p className="text-slate-600">{contract.counterparty}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(contract.status)}>
                {contract.status}
              </Badge>
              <Button
                onClick={() => navigate(`/contracts/${contract.id}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Contract
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Contract Overview */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="w-4 h-4" />
                    Contract Type
                  </div>
                  <p className="text-slate-900">{contract.contract_type}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <DollarSign className="w-4 h-4" />
                    Contract Value
                  </div>
                  <p className="text-slate-900 text-xl font-semibold">
                    {formatCurrency(contract.contract_value)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="w-4 h-4" />
                    Effective Date
                  </div>
                  <p className="text-slate-900">
                    {contract.effective_date ? format(new Date(contract.effective_date), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="w-4 h-4" />
                    Expiration Date
                  </div>
                  <p className="text-slate-900">
                    {contract.expiration_date ? format(new Date(contract.expiration_date), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <AlertTriangle className="w-4 h-4" />
                    Renewal Notice
                  </div>
                  <p className="text-slate-900">{contract.renewal_notice_days || 30} days</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText className="w-4 h-4" />
                    File Name
                  </div>
                  <p className="text-slate-900">{contract.file_name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Currency</h4>
                  <p className="text-slate-900">{contract.currency || 'USD'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Created</h4>
                  <p className="text-slate-900">{format(new Date(contract.created_at), 'MMM d, yyyy at h:mm a')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
