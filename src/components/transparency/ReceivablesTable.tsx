"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency } from "@/lib/formatters";
import {
  Download,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import type { Receivable, ReceivableStatus, ReceivableFilters } from "@/types/vault";
import { filterReceivables } from "@/lib/transparency/api";

interface ReceivablesTableProps {
  receivables: Receivable[];
  onExportCsv: (filtered: Receivable[]) => void;
}

export function ReceivablesTable({ receivables, onExportCsv }: ReceivablesTableProps) {
  const [filters, setFilters] = useState<ReceivableFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // TODO: Implement filter UI with originators and payers dropdowns
  // For now, only search is active

  // Apply filters and search
  const filteredReceivables = useMemo(() => {
    let result = filterReceivables(receivables, filters);

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        r =>
          r.id.toLowerCase().includes(term) ||
          r.originator.toLowerCase().includes(term) ||
          r.payer.toLowerCase().includes(term)
      );
    }

    return result;
  }, [receivables, filters, searchTerm]);

  const getStatusBadge = (status: ReceivableStatus) => {
    const variants = {
      Performing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Matured: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      Repaid: 'bg-green-500/10 text-green-400 border-green-500/20',
      Disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    Array.isArray(v) ? v.length > 0 : v !== undefined
  );

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const toggleStatusFilter = (status: ReceivableStatus) => {
    setFilters(prev => {
      const current = prev.status || [];
      const updated = current.includes(status)
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: updated.length > 0 ? updated : undefined };
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search by ID, originator, or payer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 text-xs">({Object.keys(filters).length})</span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredReceivables.length} receivable{filteredReceivables.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportCsv(filteredReceivables)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm font-medium mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {(['Performing', 'Matured', 'Repaid', 'Disputed'] as ReceivableStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  aria-label={`Filter by ${status} status`}
                  aria-pressed={filters.status?.includes(status)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filters.status?.includes(status)
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Originator</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead className="text-right">Face Value</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">Advance %</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No receivables match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceivables.map(r => (
                  <TableRow key={r.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-sm">{r.id}</TableCell>
                    <TableCell className="text-sm">{r.originator}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{r.payer}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCompactCurrency(r.faceValue)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCompactCurrency(r.costBasis)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {(r.advancePct * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        const maturityDate = new Date(r.maturityDate);
                        const isValidDate = !isNaN(maturityDate.getTime());

                        if (!isValidDate) {
                          return <span className="text-red-400">Invalid date</span>;
                        }

                        return (
                          <>
                            {maturityDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {r.status !== 'Repaid' && r.daysToMaturity !== undefined && r.daysToMaturity >= 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({r.daysToMaturity}d)
                              </span>
                            )}
                            {r.status !== 'Repaid' && r.daysPastDue !== undefined && r.daysPastDue > 0 && (
                              <span className="text-xs text-red-400 ml-1">
                                (+{r.daysPastDue}d)
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-center">
                      {r.links?.invoiceUrl ? (
                        <a
                          href={r.links.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1 text-primary hover:text-primary/80 transition-colors"
                          aria-label="View invoice"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
