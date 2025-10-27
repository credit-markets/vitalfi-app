import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

export function shortenAddress(address: string | undefined, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format ISO date string to readable format
 * @example "2025-11-15T00:00:00Z" → "Nov 15, 2025"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Pluralize a unit based on count
 * @example pluralize(1, 'day') → "1 day"
 * @example pluralize(5, 'day') → "5 days"
 */
export function pluralize(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

/**
 * Calculate days until a future date
 * @returns Number of days until the date (minimum 0)
 */
export function daysUntil(iso: string): number {
  const d = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return d;
}

/**
 * Calculate days between two dates
 * @returns Number of days between the dates (minimum 0)
 */
export function daysBetween(startIso: string, endIso: string): number {
  const days = Math.max(
    0,
    Math.ceil((new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24))
  );
  return days;
}

/**
 * Calculate expected yield based on principal, APY, and vault duration
 * @param principalSol Principal amount in SOL
 * @param apyPct Annual percentage yield
 * @param fundingEndIso Funding end date (when vault becomes active)
 * @param maturityIso Maturity date in ISO format
 * @returns Expected yield in SOL
 */
export function expectedYieldSol(
  principalSol: number,
  apyPct: number,
  maturityIso: string,
  fundingEndIso?: string
): number {
  // If fundingEndIso is provided, use vault duration (fundingEnd → maturity)
  // Otherwise, fall back to time remaining (now → maturity) for backwards compatibility
  const days = fundingEndIso
    ? daysBetween(fundingEndIso, maturityIso)
    : daysUntil(maturityIso);
  return principalSol * (apyPct / 100) * (days / 365);
}
