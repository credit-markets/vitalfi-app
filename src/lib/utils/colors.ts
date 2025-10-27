import type { VaultStatus } from "@/types/vault";

/**
 * Centralized vault status color definitions
 * Use these to ensure consistent badge colors across the app
 *
 * Color scheme:
 * - Funding: Cyan (accepting deposits)
 * - Active: Purple (funded, deployed and earning)
 * - Matured: Green (completed, payouts available)
 * - Canceled: Gray (funding failed, refunds available)
 * - Closed: Dark gray (vault cleaned up and closed)
 */
export const STATUS_COLORS: Record<VaultStatus, { bg: string; text: string; border: string }> = {
  Funding: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  Active: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  Matured: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  Canceled: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  Closed: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-500',
    border: 'border-slate-500/20',
  },
};

/**
 * Get combined className string for a status badge
 * Falls back to 'Closed' colors if an invalid status is provided
 */
export function getStatusColors(status: VaultStatus): string {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.Closed;
  return `${colors.bg} ${colors.text} ${colors.border}`;
}
