import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, DollarSign, Upload, Eye, Edit, AlertTriangle } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { format } from "date-fns";
import { sumContractValues, averageContractValue, daysBetween, riskScore } from '@/lib/utils';
import { fetchExchangeRates, aggregatePortfolioValue } from '@/lib/currencyUtils';

interface ContractLibraryProps {
  setActiveTab: (tab: string) => void;
}

export const ContractLibrary = ({ setActiveTab }: ContractLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState(() => localStorage.getItem('defaultCurrency') || 'USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetchExchangeRates(defaultCurrency).then(setExchangeRates);
  }, [defaultCurrency]);

  const { data: contracts, isLoading, error } = useContracts();

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contract_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleViewDetails = (contractId: string) => {
    window.location.href = `/contracts/${contractId}`;
  };

  const handleEditContract = (contractId: string) => {
    // For now, redirect to details page with edit mode
    window.location.href = `/contracts/${contractId}`;
  };

  const handleAddContract = () => {
    // Use the setActiveTab prop to switch to the upload tab
    setActiveTab('upload');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600">Loading contracts...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="text-center py-8 text-red-600">Error loading contracts</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contracts) return null;

  // Math: Portfolio calculations
  const totalValue = sumContractValues(contracts);
  const avgValue = averageContractValue(contracts);
  const soonExpiring = contracts.filter(c => c.expiration_date && daysBetween(new Date(), c.expiration_date) <= 30).length;
  const portfolioRisk = riskScore(totalValue, soonExpiring);
  const aggregatedValue = exchangeRates ? aggregatePortfolioValue(contracts, defaultCurrency, exchangeRates) : null;


  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contract Library
          </CardTitle>
          <CardDescription>
            Search and manage your contract portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search contracts, counterparties, or types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {aggregatedValue !== null ? `${aggregatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${defaultCurrency}` : 'Loading...'}
            </div>
            <div className="text-sm text-slate-500">Average: {avgValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Portfolio Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{portfolioRisk}</div>
            <div className="text-sm text-slate-500">Risk Score (0-5)</div>
          </CardContent>
        </Card>
      </div>

      {/* Contract List */}
      <div className="grid gap-4">
        {!filteredContracts || filteredContracts.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              {!contracts || contracts.length === 0 ? (
                <>
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No contracts yet</h3>
                  <p className="text-slate-500 mb-6">
                    Get started by uploading your first contract document
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={handleAddContract}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Contract
                  </Button>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No contracts found</h3>
                  <p className="text-slate-500">Try adjusting your search criteria or filters</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => (
            <Card key={contract.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {contract.title}
                    </h3>
                    <p className="text-slate-600 mb-2">{contract.counterparty}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                      <Badge variant="outline">{contract.contract_type}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(contract.contract_value)}
                    </div>
                    <div className="text-sm text-slate-500">Contract Value</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Effective Date</div>
                      <div className="text-sm text-slate-600">
                        {contract.effective_date ? format(new Date(contract.effective_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Expiration Date</div>
                      <div className="text-sm text-slate-600">
                        {contract.expiration_date ? format(new Date(contract.expiration_date), 'MMM d, yyyy') : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-700">Currency</div>
                      <div className="text-sm text-slate-600">{contract.currency || 'USD'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {contract.renewal_notice_days || 30} day notice
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(contract.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => handleEditContract(contract.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
