
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react";

interface Contract {
  id: string;
  title: string;
  counterparty: string;
  type: string;
  status: 'active' | 'expired' | 'pending' | 'terminated';
  effectiveDate: string;
  renewalDate: string;
  value: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
}

const mockContracts: Contract[] = [
  {
    id: '1',
    title: 'Shipping Services Agreement',
    counterparty: 'Global Maritime Ltd',
    type: 'Service Agreement',
    status: 'active',
    effectiveDate: '2024-01-15',
    renewalDate: '2024-12-31',
    value: '$2,500,000',
    riskLevel: 'low',
    tags: ['shipping', 'logistics', 'international']
  },
  {
    id: '2',
    title: 'Equipment Lease Contract',
    counterparty: 'TechEquip Solutions',
    type: 'Lease Agreement',
    status: 'active',
    effectiveDate: '2023-06-01',
    renewalDate: '2024-08-15',
    value: '$450,000',
    riskLevel: 'medium',
    tags: ['equipment', 'technology', 'lease']
  },
  {
    id: '3',
    title: 'Supply Chain Partnership',
    counterparty: 'ACME Manufacturing',
    type: 'Partnership Agreement',
    status: 'pending',
    effectiveDate: '2024-03-01',
    renewalDate: '2025-03-01',
    value: '$1,200,000',
    riskLevel: 'high',
    tags: ['manufacturing', 'supply chain', 'procurement']
  },
  {
    id: '4',
    title: 'Software License Agreement',
    counterparty: 'CloudTech Inc',
    type: 'License Agreement',
    status: 'active',
    effectiveDate: '2023-09-01',
    renewalDate: '2024-09-01',
    value: '$75,000',
    riskLevel: 'low',
    tags: ['software', 'SaaS', 'technology']
  }
];

export const ContractLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [contracts] = useState<Contract[]>(mockContracts);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesRisk = riskFilter === "all" || contract.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'terminated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: Contract['riskLevel']) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
    }
  };

  const getRiskIcon = (risk: Contract['riskLevel']) => {
    return <AlertTriangle className={`w-4 h-4 ${getRiskColor(risk)}`} />;
  };

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
                placeholder="Search contracts, counterparties, or tags..."
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
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contract List */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => (
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
                    <Badge variant="outline">{contract.type}</Badge>
                    <div className="flex items-center gap-1">
                      {getRiskIcon(contract.riskLevel)}
                      <span className={`text-sm font-medium ${getRiskColor(contract.riskLevel)}`}>
                        {contract.riskLevel} risk
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {contract.value}
                  </div>
                  <div className="text-sm text-slate-500">Contract Value</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Effective Date</div>
                    <div className="text-sm text-slate-600">{contract.effectiveDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Renewal Date</div>
                    <div className="text-sm text-slate-600">{contract.renewalDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Total Value</div>
                    <div className="text-sm text-slate-600">{contract.value}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {contract.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No contracts found</h3>
            <p className="text-slate-500">Try adjusting your search criteria or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
