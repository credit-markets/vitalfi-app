"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VaultStatus } from "@/types/vault";

export type StatusFilterValue = 'all' | VaultStatus;

interface StatusFilterProps {
  value: StatusFilterValue;
  onValueChange: (value: StatusFilterValue) => void;
  counts?: {
    all: number;
    Funding: number;
    Active: number;
    Matured: number;
    Canceled: number;
    Closed: number;
  };
  className?: string;
}

// Type guard to validate StatusFilterValue at runtime
function isStatusFilterValue(value: string): value is StatusFilterValue {
  return value === 'all' || value === 'Funding' || value === 'Active' || value === 'Matured' || value === 'Canceled' || value === 'Closed';
}

export function StatusFilter({ value, onValueChange, counts, className }: StatusFilterProps) {
  const handleValueChange = (v: string) => {
    if (isStatusFilterValue(v)) {
      onValueChange(v);
    }
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange} className={className}>
      <TabsList role="tablist" aria-label="Filter vaults by status">
        <TabsTrigger value="all">
          All
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.all})</span>}
        </TabsTrigger>
        <TabsTrigger value="Funding">
          Funding
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Funding})</span>}
        </TabsTrigger>
        <TabsTrigger value="Active">
          Active
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Active})</span>}
        </TabsTrigger>
        <TabsTrigger value="Matured">
          Matured
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Matured})</span>}
        </TabsTrigger>
        <TabsTrigger value="Canceled">
          Canceled
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Canceled})</span>}
        </TabsTrigger>
        <TabsTrigger value="Closed">
          Closed
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Closed})</span>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
