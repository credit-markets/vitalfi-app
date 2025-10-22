"use client";

import { Calendar, TrendingUp } from "lucide-react";
import type { PortfolioPosition } from "@/hooks/vault/use-portfolio-api";
import { getUpcomingEvents } from "@/lib/portfolio/selectors";
import { formatDate } from "@/lib/utils";

interface TimelineProps {
  positions: PortfolioPosition[];
  onEventClick?: (vaultId: string) => void;
}

/**
 * Horizontal scrollable timeline showing upcoming Funding End and Maturity events
 * Clicking an event scrolls to the corresponding vault card
 */
export function Timeline({ positions, onEventClick }: TimelineProps) {
  const events = getUpcomingEvents(positions);

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Events</h2>
        <span className="text-xs text-muted-foreground">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth hide-scrollbar">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventClick?.(event.vaultId)}
            className="flex-shrink-0 min-w-[240px] sm:min-w-[280px] p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all touch-manipulation text-left"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  event.type === 'FUNDING_END'
                    ? 'bg-violet-500/10 text-violet-400'
                    : 'bg-cyan-500/10 text-cyan-400'
                }`}
              >
                {event.type === 'FUNDING_END' ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">
                  {event.type === 'FUNDING_END' ? 'Funding Ends' : 'Maturity'}
                </div>
                <div className="font-medium text-sm mb-1 truncate">
                  {event.vaultName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(event.date)}
                  <span className="mx-1">•</span>
                  {event.daysAway === 0 ? (
                    <span className="text-orange-400 font-medium">Today</span>
                  ) : event.daysAway === 1 ? (
                    <span className="text-orange-400 font-medium">Tomorrow</span>
                  ) : (
                    <span>in {event.daysAway} days</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
