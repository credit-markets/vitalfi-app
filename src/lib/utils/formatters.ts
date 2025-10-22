/**
 * Compact number formatting utilities for institutional UI
 */

/**
 * Format large numbers in compact notation (e.g., 2.4M, 150K)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format currency in compact notation with $ prefix
 */
export function formatCompactCurrency(value: number): string {
  return `$${formatCompactNumber(value)}`;
}

/**
 * Format SOL amount with proper decimals
 */
export function formatSOL(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} SOL`;
}

/**
 * Format timestamp to relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = Date.now();
  const target = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const diff = target - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const future = diff > 0;

  if (days > 0) {
    return future ? `in ${days}d` : `${days}d ago`;
  }
  if (hours > 0) {
    return future ? `in ${hours}h` : `${hours}h ago`;
  }
  if (minutes > 0) {
    return future ? `in ${minutes}m` : `${minutes}m ago`;
  }
  return future ? "in a moment" : "just now";
}

/**
 * Format countdown (e.g., "1d 5h remaining")
 */
export function formatCountdown(targetDate: Date | string): string {
  const now = Date.now();
  const target = typeof targetDate === "string" ? new Date(targetDate).getTime() : targetDate.getTime();
  const diff = target - now;

  if (diff <= 0) return "Ready";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "< 1m";
}

/**
 * Format currency with K/M notation
 */
export function formatCurrency(n: number, currency: string = 'USD'): string {
  const prefix = currency === 'USD' ? '$' : currency === 'SOL' ? '' : `${currency} `;
  const suffix = currency === 'SOL' ? ' SOL' : '';

  if (n >= 1_000_000) {
    return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
  }
  if (n >= 1_000) {
    return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
  }
  return `${prefix}${n.toFixed(0)}${suffix}`;
}

/**
 * Format percentage per year (e.g., 0.12 -> "12.0% p.y.")
 */
export function formatPercentPY(p: number): string {
  return `${(p * 100).toFixed(1)}% p.y.`;
}
