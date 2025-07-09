// Utility to fetch and cache exchange rates (using exchangerate.host)
export async function fetchExchangeRates(base = 'USD'): Promise<Record<string, number>> {
  const res = await fetch(`https://api.exchangerate.host/latest?base=${base}`);
  const data = await res.json();
  return data.rates;
}

// Convert an amount from one currency to another using rates
export function convertCurrency(amount: number, from: string, to: string, rates: Record<string, number>): number {
  if (from === to) return amount;
  if (!rates[from] || !rates[to]) return amount;
  // Convert to base, then to target
  const baseAmount = amount / rates[from];
  return baseAmount * rates[to];
}

// Aggregate contracts in a target currency
export function aggregatePortfolioValue(contracts: { contract_value: number, currency: string }[], target: string, rates: Record<string, number>): number {
  return contracts.reduce((sum, c) => {
    if (!c.contract_value || !c.currency) return sum;
    return sum + convertCurrency(c.contract_value, c.currency, target, rates);
  }, 0);
}
