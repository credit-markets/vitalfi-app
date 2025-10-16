import type { VaultStage } from "@/types/vault";

/**
 * Centralized vault stage color definitions
 * Use these to ensure consistent badge colors across the app
 *
 * Color scheme:
 * - Funding: Cyan (active fundraising)
 * - Funded: Purple (deployed and earning)
 * - Matured: Green (completed)
 * - Closed: Gray (archived)
 */
export const STAGE_COLORS: Record<VaultStage, { bg: string; text: string; border: string }> = {
  Funding: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  Funded: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  Matured: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  Closed: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

/**
 * Get combined className string for a stage badge
 * Falls back to 'Closed' colors if an invalid stage is provided
 */
export function getStageColors(stage: VaultStage): string {
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.Closed;
  return `${colors.bg} ${colors.text} ${colors.border}`;
}
