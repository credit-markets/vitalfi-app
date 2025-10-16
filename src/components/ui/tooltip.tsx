"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipId = React.useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      setIsVisible(false);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onKeyDown={handleKeyDown}
    >
      <div
        tabIndex={0}
        aria-describedby={isVisible ? tooltipId : undefined}
        role="button"
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          aria-label={typeof content === 'string' ? content : undefined}
          className={cn(
            "absolute z-[100] px-2.5 py-1.5 text-xs leading-tight text-foreground bg-popover border border-border rounded shadow-xl",
            "left-0 bottom-full mb-2",
            "w-max max-w-[180px]",
            "pointer-events-none",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-4 -mt-[1px] border-[4px] border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}
