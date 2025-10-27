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
      <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList role="tablist" aria-label="Filter vaults by status" className="flex-nowrap w-max sm:w-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-3 sm:px-4">
            All
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.all})</span>}
          </TabsTrigger>
          <TabsTrigger value="Funding" className="text-xs sm:text-sm px-3 sm:px-4">
            Funding
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.Funding})</span>}
          </TabsTrigger>
          <TabsTrigger value="Active" className="text-xs sm:text-sm px-3 sm:px-4">
            Active
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.Active})</span>}
          </TabsTrigger>
          <TabsTrigger value="Matured" className="text-xs sm:text-sm px-3 sm:px-4">
            Matured
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.Matured})</span>}
          </TabsTrigger>
          <TabsTrigger value="Canceled" className="text-xs sm:text-sm px-3 sm:px-4">
            Canceled
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.Canceled})</span>}
          </TabsTrigger>
          <TabsTrigger value="Closed" className="text-xs sm:text-sm px-3 sm:px-4">
            Closed
            {counts && <span className="ml-1 sm:ml-1.5 text-xs opacity-70 hidden sm:inline">({counts.Closed})</span>}
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}
