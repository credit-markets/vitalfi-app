"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonetary } from "@/lib/utils/formatters";
import { formatDate, shortenAddress } from "@/lib/utils";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { copyTransactionSignature, exportSuccess } from "@/lib/toast";
import { getTokenSymbol } from "@/lib/sdk/config";
import { NATIVE_MINT } from "@solana/spl-token";
import type { PortfolioActivity } from "@/hooks/vault/use-portfolio-api";
import Link from "next/link";

interface ActivityTableProps {
  activity: PortfolioActivity[];
}

const ITEMS_PER_PAGE = 10;

/**
 * Activity table with pagination
 */
export function ActivityTable({ activity }: ActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort activity by date (newest first)
  const sortedActivity = useMemo(() => {
    return [...activity].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [activity]);

  const totalPages = Math.ceil(sortedActivity.length / ITEMS_PER_PAGE);

  const paginatedActivity = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedActivity.slice(startIndex, endIndex);
  }, [sortedActivity, currentPage]);

  const copyTxSig = async (txSig: string) => {
    await copyTransactionSignature(txSig);
  };

  const exportCSV = () => {
    const headers = ["Date", "Vault", "Amount", "Type", "Tx Signature"];
    const rows = sortedActivity.map((a) => [
      new Date(a.date).toLocaleString(),
      a.vaultName,
      a.amountSol.toString(),
      a.type,
      a.txSig,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    exportSuccess("CSV");
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Activity</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="py-4 text-center">Date</TableHead>
                <TableHead className="py-4 text-center">Vault</TableHead>
                <TableHead className="py-4 text-center">Amount</TableHead>
                <TableHead className="py-4 text-center">Type</TableHead>
                <TableHead className="py-4 text-center">Transaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActivity.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No activity found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedActivity.map((activityItem, idx) => {
                  const tokenMint =
                    activityItem.assetMint || NATIVE_MINT.toBase58();
                  const tokenSymbol = getTokenSymbol(tokenMint);

                  return (
                    <TableRow
                      key={`${activityItem.txSig}-${idx}`}
                      className="hover:bg-muted/20"
                    >
                      <TableCell className="text-sm py-4 text-center">
                        {formatDate(activityItem.date)}
                      </TableCell>
                      <TableCell className="text-sm py-4 text-center">
                        <Link
                          href={`/vault/${activityItem.vaultId}`}
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          {activityItem.vaultName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm py-4 text-center font-medium">
                        {formatMonetary(activityItem.amountSol, tokenSymbol)}
                      </TableCell>
                      <TableCell className="text-sm py-4 text-center">
                        <Badge
                          className={
                            activityItem.type === "Deposit"
                              ? "bg-primary/70 text-primary-foreground border-primary/70"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }
                        >
                          {activityItem.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => copyTxSig(activityItem.txSig)}
                            className="text-xs bg-muted/30 px-2 py-1 rounded font-mono hover:bg-muted/50 transition-colors cursor-pointer"
                            title="Click to copy transaction signature"
                          >
                            {shortenAddress(activityItem.txSig, 4)}
                          </button>
                          <a
                            href={`https://explorer.solana.com/tx/${activityItem.txSig}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1 text-primary hover:text-primary/80 transition-colors"
                            aria-label="View transaction on Solana Explorer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {activity.length > 0 && (
        <nav className="flex items-center justify-end" aria-label="Pagination">
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
                Showing {paginatedActivity.length} of {sortedActivity.length}{" "}
                {sortedActivity.length === 1 ? "transaction" : "transactions"}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground" aria-current="page">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground" role="status">
              Showing {paginatedActivity.length} of {sortedActivity.length}{" "}
              {sortedActivity.length === 1 ? "transaction" : "transactions"}
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
