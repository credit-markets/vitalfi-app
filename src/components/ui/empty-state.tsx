import { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * Empty state component for displaying when no data is available
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  // Generate unique ID for ARIA relationship
  const titleId = `empty-state-title-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby={titleId}
      className="flex flex-col items-center justify-center gap-4 p-12 text-center"
    >
      {icon && (
        <div className="text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
