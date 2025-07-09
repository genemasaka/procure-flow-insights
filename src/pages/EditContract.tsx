import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Save, Trash2, Sparkles, AlertTriangle, Calendar, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import allCurrencies from 'currency-codes/data';

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
  contract_content: string | null;
  created_at: string;
}

const EditContract = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    counterparty: '',
    contract_type: '',
    status: '',
    contract_value: '',
    currency: '',
    effective_date: '',
    expiration_date: '',
    renewal_notice_days: '',
    file_name: '',
    contract_content: ''
  });

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      console.log('Fetching contract details for ID:', id);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Contract data retrieved:', data);
      setContract(data);
      
      // Update form data with retrieved contract information
      const updatedFormData = {
        title: data.title || '',
        counterparty: data.counterparty || '',
        contract_type: data.contract_type || '',
        status: data.status || '',
        contract_value: data.contract_value?.toString() || '',
        currency: data.currency || 'USD',
        effective_date: data.effective_date || '',
        expiration_date: data.expiration_date || '',
        renewal_notice_days: data.renewal_notice_days?.toString() || '30',
        file_name: data.file_name || '',
        contract_content: data.contract_content || ''
      };
      
      console.log('Setting form data:', updatedFormData);
      setFormData(updatedFormData);
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

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating field ${field} with value:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        title: formData.title,
        counterparty: formData.counterparty,
        contract_type: formData.contract_type,
        status: formData.status,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        currency: formData.currency,
        effective_date: formData.effective_date || null,
        expiration_date: formData.expiration_date || null,
        renewal_notice_days: formData.renewal_notice_days ? parseInt(formData.renewal_notice_days) : 30,
        file_name: formData.file_name || null,
        contract_content: formData.contract_content || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract updated successfully",
      });
      
      navigate(`/contracts/${id}`);
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete related records first
      await supabase.from('deadlines').delete().eq('contract_id', id);
      await supabase.from('ai_insights').delete().eq('contract_id', id);
      await supabase.from('document_uploads').delete().eq('contract_id', id);
      
      // Delete the contract
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Error",
        description: "Failed to delete contract",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const generateAiSuggestions = async () => {
    setGeneratingAi(true);
    try {
      const contractInfo = `
        Contract: ${formData.title}
        Counterparty: ${formData.counterparty}
        Type: ${formData.contract_type}
        Value: ${formData.contract_value} ${formData.currency}
        Status: ${formData.status}
        Contract Content: ${formData.contract_content || 'No content provided'}
      `;

      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Please analyze this contract and provide specific suggestions for improving clauses, terms, or identifying potential risks. Focus on actionable recommendations: ${contractInfo}`,
          userId: 'contract-editor'
        }
      });

      if (response.data?.response) {
        setAiSuggestions(response.data.response);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions",
        variant: "destructive"
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          <p className="text-slate-500 mb-4">The contract you're trying to edit doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Back to Dashboard</Button>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Contract</h1>
              <p className="text-slate-600">Modify contract details and manage settings</p>
            </div>
            <Badge variant="outline" className={getStatusColor(formData.status)}>
              {formData.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the core contract details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contract Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter contract title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="counterparty">Counterparty</Label>
                  <Input
                    id="counterparty"
                    value={formData.counterparty}
                    onChange={(e) => handleInputChange('counterparty', e.target.value)}
                    placeholder="Enter counterparty name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(value) => handleInputChange('contract_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service Agreement</SelectItem>
                      <SelectItem value="supply">Supply Contract</SelectItem>
                      <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                      <SelectItem value="employment">Employment Contract</SelectItem>
                      <SelectItem value="lease">Lease Agreement</SelectItem>
                      <SelectItem value="partnership">Partnership Agreement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Content */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Content
              </CardTitle>
              <CardDescription>Enter or edit the full contract text</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="contract_content">Full Contract Text</Label>
                <Textarea
                  id="contract_content"
                  value={formData.contract_content}
                  onChange={(e) => handleInputChange('contract_content', e.target.value)}
                  placeholder={formData.contract_content ? "" : "Enter the complete contract text here..."}
                  className="min-h-[300px] resize-vertical font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  {formData.contract_content ? `${formData.contract_content.length} characters` : 'No content loaded'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Contract Value</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => handleInputChange('contract_value', e.target.value)}
                    placeholder="Enter contract value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>{currency.code} - {currency.currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Terms */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates & Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_date">Effective Date</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => handleInputChange('effective_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiration_date">Expiration Date</Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renewal_notice_days">Renewal Notice (Days)</Label>
                  <Input
                    id="renewal_notice_days"
                    type="number"
                    value={formData.renewal_notice_days}
                    onChange={(e) => handleInputChange('renewal_notice_days', e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="file_name">File Name</Label>
                <Input
                  id="file_name"
                  value={formData.file_name}
                  onChange={(e) => handleInputChange('file_name', e.target.value)}
                  placeholder="Enter file name (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Assistance */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Contract Assistant
              </CardTitle>
              <CardDescription>Get AI-powered suggestions for improving your contract clauses and terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={generateAiSuggestions}
                  disabled={generatingAi}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {generatingAi ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing Contract...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Contract & Get AI Suggestions
                    </>
                  )}
                </Button>
                
                {aiSuggestions && (
                  <div className="space-y-2">
                    <Label>AI Analysis & Suggestions</Label>
                    <Textarea
                      value={aiSuggestions}
                      onChange={(e) => setAiSuggestions(e.target.value)}
                      placeholder="AI suggestions will appear here..."
                      className="min-h-[120px] resize-vertical"
                      readOnly
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Contract
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the contract
                    and all associated data including deadlines, insights, and documents.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Deleting..." : "Delete Contract"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/contracts/${id}`)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditContract;
