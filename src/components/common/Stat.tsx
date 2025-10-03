"use client";

import { formatDelta } from "@/lib/formatters";

interface StatProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  className?: string;
}

/**
 * Large number display with optional delta percentage
 * Used for showing Current Value, Earnings, etc.
 */
export function Stat({ label, value, delta, deltaLabel, className }: StatProps) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl md:text-4xl font-bold">{value}</div>
      {delta !== undefined && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-sm font-semibold ${
              delta > 0 ? "text-green-500" : delta < 0 ? "text-muted-foreground" : "text-muted-foreground"
            }`}
          >
            {formatDelta(delta)}
          </span>
          {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
