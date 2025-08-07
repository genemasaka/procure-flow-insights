
import { differenceInDays, format, parseISO, isBefore, isAfter } from 'date-fns';

export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  contract_type: string;
  status: string;
  effective_date: string | null;
  expiration_date: string | null;
  contract_value: number | null;
  currency: string | null;
  renewal_notice_days: number | null;
}

export interface Deadline {
  id: string;
  contract_id: string | null;
  title: string;
  description: string | null;
  type: string;
  due_date: string;
  priority: string;
  status: string;
  contracts?: {
    title: string;
    counterparty: string;
  };
}

export const getContractStatus = (contract: Contract) => {
  if (!contract.expiration_date) return contract.status;
  
  const expirationDate = parseISO(contract.expiration_date);
  const today = new Date();
  
  if (isBefore(expirationDate, today)) {
    return 'expired';
  }
  
  const daysUntilExpiration = differenceInDays(expirationDate, today);
  if (daysUntilExpiration <= 30) {
    return 'expiring_soon';
  }
  
  return contract.status;
};

export const getDeadlineUrgency = (deadline: Deadline) => {
  const dueDate = parseISO(deadline.due_date);
  const today = new Date();
  const daysRemaining = differenceInDays(dueDate, today);
  
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 14) return 'soon';
  return 'normal';
};

export const formatCurrency = (value: number | null, currency?: string) => {
  if (!value) return 'N/A';
  
  // Get user's default currency from localStorage, fallback to USD
  const defaultCurrency = localStorage.getItem('defaultCurrency') || 'USD';
  const displayCurrency = currency || defaultCurrency;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: displayCurrency,
  }).format(value);
};

export const formatDateRange = (startDate: string | null, endDate: string | null) => {
  if (!startDate && !endDate) return 'No dates specified';
  if (!startDate) return `Ends ${format(parseISO(endDate!), 'MMM d, yyyy')}`;
  if (!endDate) return `Starts ${format(parseISO(startDate), 'MMM d, yyyy')}`;
  
  return `${format(parseISO(startDate), 'MMM d, yyyy')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
};

export const calculateContractMetrics = (contracts: Contract[]) => {
  const activeContracts = contracts.filter(c => getContractStatus(c) === 'active');
  const expiringContracts = contracts.filter(c => getContractStatus(c) === 'expiring_soon');
  const totalValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);
  const averageValue = contracts.length > 0 ? totalValue / contracts.length : 0;
  
  return {
    total: contracts.length,
    active: activeContracts.length,
    expiring: expiringContracts.length,
    totalValue,
    averageValue,
  };
};
