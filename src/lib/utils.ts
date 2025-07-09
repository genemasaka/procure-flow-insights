import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date difference in days
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Simple risk scoring (example: based on contract value and days to expiration)
export function riskScore(contractValue: number, daysToExpiration: number): number {
  let score = 0;
  if (contractValue > 100000) score += 2;
  if (daysToExpiration < 30) score += 3;
  else if (daysToExpiration < 90) score += 1;
  return Math.min(score, 5); // Max risk score 5
}

// Contract amount calculation (sum, average, etc.)
export function sumContractValues(contracts: { contract_value: number }[]): number {
  return contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);
}

export function averageContractValue(contracts: { contract_value: number }[]): number {
  const valid = contracts.filter(c => c.contract_value != null);
  return valid.length ? sumContractValues(valid) / valid.length : 0;
}
