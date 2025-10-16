import { Card } from "@/components/ui/card";

interface SummaryStatProps {
  label: string;
  value: string;
}

export function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <Card className="p-4 bg-card border border-border">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">
          {value}
        </p>
      </div>
    </Card>
  );
}
