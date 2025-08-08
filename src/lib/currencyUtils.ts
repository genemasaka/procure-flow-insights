// Currency code normalization
const normalizeCurrencyCode = (code: string): string => {
  const normalizations: Record<string, string> = {
    'KSH': 'KES', // Kenyan Shilling
  };
  return normalizations[code] || code;
};

// Utility to fetch and cache exchange rates (using exchangerate.host)
export async function fetchExchangeRates(base = 'USD'): Promise<Record<string, number>> {
  try {
    const normalizedBase = normalizeCurrencyCode(base);
    const res = await fetch(`https://api.exchangerate.host/latest?base=${normalizedBase}`);
    
    if (!res.ok) {
      console.warn(`Exchange rate API failed: ${res.status}`);
      return {};
    }
    
    const data = await res.json();
    
    if (!data.success || !data.rates) {
      console.warn('Exchange rate API returned invalid data:', data);
      return {};
    }
    
    return data.rates;
  } catch (error) {
    console.warn('Failed to fetch exchange rates:', error);
    return {};
  }
}

// Convert an amount from one currency to another using rates
export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>): number {
  const normalizedFrom = normalizeCurrencyCode(from);
  const normalizedTo = normalizeCurrencyCode(to);
  
  if (normalizedFrom === normalizedTo) return amount;
  if (!rates[normalizedFrom] || !rates[normalizedTo]) return amount;
  
  // Convert to base, then to target
  const baseAmount = amount / rates[normalizedFrom];
  return baseAmount * rates[normalizedTo];
}

// Aggregate contracts in a target currency
export function aggregatePortfolioValue(contracts: { contract_value: number, currency: string }[], target: string, rates: Record<string, number>): number {
  return contracts.reduce((sum, c) => {
    if (!c.contract_value || !c.currency) return sum;
    return sum + convertCurrency(c.contract_value, c.currency, target, rates);
  }, 0);
}

// Get a fallback portfolio value in original currencies when exchange rates fail
export function getFallbackPortfolioValue(contracts: { contract_value: number, currency: string }[], defaultCurrency: string): number {
  const contractsInTargetCurrency = contracts.filter(c => 
    c.contract_value && c.currency && normalizeCurrencyCode(c.currency) === normalizeCurrencyCode(defaultCurrency)
  );
  
  return contractsInTargetCurrency.reduce((sum, c) => sum + c.contract_value, 0);
}
