"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VaultStage } from "@/types/vault";

export type StageFilterValue = 'all' | VaultStage;

interface StageFilterProps {
  value: StageFilterValue;
  onValueChange: (value: StageFilterValue) => void;
  counts?: {
    all: number;
    Funding: number;
    Funded: number;
    Matured: number;
  };
  className?: string;
}

export function StageFilter({ value, onValueChange, counts, className }: StageFilterProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as StageFilterValue)} className={className}>
      <TabsList role="tablist" aria-label="Filter vaults by stage">
        <TabsTrigger value="all">
          All
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.all})</span>}
        </TabsTrigger>
        <TabsTrigger value="Funding">
          Funding
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Funding})</span>}
        </TabsTrigger>
        <TabsTrigger value="Funded">
          Funded
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Funded})</span>}
        </TabsTrigger>
        <TabsTrigger value="Matured">
          Matured
          {counts && <span className="ml-1.5 text-xs opacity-70">({counts.Matured})</span>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
