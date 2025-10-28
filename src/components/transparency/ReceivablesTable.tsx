"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/utils/formatters";
import {
  Download,
  ExternalLink,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Receivable, ReceivableStatus, ReceivableFilters } from "@/types/vault";
import { filterReceivables } from "@/lib/transparency/utils";
import { useIsMobile } from "@/hooks/ui/use-mobile";

interface ReceivablesTableProps {
  receivables: Receivable[];
  onExportCsv: (filtered: Receivable[]) => void;
}

const ITEMS_PER_PAGE = 10;

export function ReceivablesTable({ receivables, onExportCsv }: ReceivablesTableProps) {
  const [filters, setFilters] = useState<ReceivableFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // TODO: Implement filter UI with originators and payers dropdowns
  // For now, only search is active

  // Apply filters, search, and sort by maturity date
  const filteredReceivables = useMemo(() => {
    let result = filterReceivables(receivables, filters);

    // Apply search (debounced)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        r =>
          r.id.toLowerCase().includes(term) ||
          r.originator.toLowerCase().includes(term) ||
          r.payer.toLowerCase().includes(term)
      );
    }

    // Sort by maturity date (nearest maturity first)
    result.sort((a, b) =>
      new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()
    );

    return result;
  }, [receivables, filters, debouncedSearchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReceivables.length / ITEMS_PER_PAGE);
  const paginatedReceivables = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredReceivables.slice(startIndex, endIndex);
  }, [filteredReceivables, currentPage]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReceivables.length]);

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

  // Don't show toolbar if there are no receivables at all
  if (receivables.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No receivables available for this vault
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:flex-1">
          <Input
            placeholder={isMobile ? "Search..." : "Search by ID, originator, or payer..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 sm:max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`touch-manipulation ${showFilters ? 'bg-primary/10' : ''}`}
          >
            <Filter className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 text-xs">({Object.keys(filters).length})</span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="touch-manipulation hidden sm:flex">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {filteredReceivables.length} receivable{filteredReceivables.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExportCsv(filteredReceivables)}
            className="touch-manipulation"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
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
                  className={`px-3 py-2 text-xs rounded-full border transition-colors touch-manipulation min-h-[44px] sm:min-h-0 sm:py-1 ${
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

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredReceivables.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No receivables match the current filters
            </Card>
          ) : (
            paginatedReceivables.map(r => (
              <Card key={r.id} className="p-4">
                <div className="space-y-3">
                  {/* Header: ID + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    {getStatusBadge(r.status)}
                  </div>

                  {/* Originator & Payer */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Originator</span>
                      <span className="font-medium">{r.originator}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payer</span>
                      <span className="font-medium truncate ml-2">{r.payer}</span>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Face Value</div>
                      <div className="text-sm font-bold">{formatCompactCurrency(r.faceValue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Cost Basis</div>
                      <div className="text-sm font-medium">{formatCompactCurrency(r.costBasis)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Advance %</div>
                      <div className="text-sm font-medium">{((r.advancePct ?? 0) * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Maturity</div>
                      <div className="text-sm font-medium">
                        {(() => {
                          const maturityDate = new Date(r.maturityDate);
                          const isValidDate = !isNaN(maturityDate.getTime());

                          if (!isValidDate) {
                            return <span className="text-red-400">Invalid</span>;
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
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Link */}
                  {r.links?.invoiceUrl && (
                    <a
                      href={r.links.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full p-2 text-sm text-primary border border-primary/20 rounded hover:bg-primary/5 transition-colors touch-manipulation"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Invoice
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Desktop Table View */
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
                paginatedReceivables.map(r => (
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
                      {((r.advancePct ?? 0) * 100).toFixed(1)}%
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
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2" aria-label="Pagination">
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1" role="status" aria-live="polite">
            {isMobile ? (
              <>
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredReceivables.length)} of {filteredReceivables.length}
              </>
            ) : (
              <>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredReceivables.length)} of{' '}
                {filteredReceivables.length} receivables
              </>
            )}
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="touch-manipulation"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="text-xs sm:text-sm text-muted-foreground px-2" aria-current="page">
              {currentPage}/{totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="touch-manipulation"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
