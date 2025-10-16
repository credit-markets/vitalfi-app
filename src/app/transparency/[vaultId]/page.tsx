"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultFacts } from "@/components/transparency/VaultFacts";
import { CollateralSection } from "@/components/transparency/CollateralSection";
import { HedgeCard } from "@/components/transparency/HedgeCard";
import { DocumentsList } from "@/components/transparency/DocumentsList";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useSidebar } from "@/contexts/SidebarContext";
import { getVaultTransparency, exportReceivablesCsv } from "@/lib/transparency/api";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { VaultTransparencyData, Receivable } from "@/types/vault";

export default function VaultTransparencyDetail() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const vaultId = params.vaultId as string;

  const [data, setData] = useState<VaultTransparencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const transparencyData = await getVaultTransparency(vaultId);
        setData(transparencyData);
      } catch (err) {
        console.error('Failed to load vault transparency:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vault data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vaultId]);

  const handleExportCsv = async (receivables: Receivable[]) => {
    try {
      const blob = await exportReceivablesCsv(vaultId, receivables);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${vaultId}-receivables-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Delay revoke for Safari compatibility - download may not start immediately
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('CSV export failed:', err);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main
        className={cn(
          "pt-24 pb-20 lg:pb-16 transition-all duration-300",
          "lg:ml-16",
          !isCollapsed && "lg:ml-64"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link href="/transparency">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Transparency
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="h-40 bg-card border border-border rounded-lg animate-pulse" />
              <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">Error loading vault data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button className="mt-4" onClick={() => router.push('/transparency')}>
                Return to Transparency Hub
              </Button>
            </div>
          ) : data ? (
            <ErrorBoundary>
              <div className="space-y-6">
                {/* 1. Vault Facts */}
                <VaultFacts summary={data.summary} lastUpdated={data.lastUpdated} />

                {/* 2. Collateral Overview + Receivables Table */}
                <CollateralSection
                  analytics={data.collateral.analytics}
                  receivables={data.collateral.items}
                  onExportCsv={handleExportCsv}
                />

                {/* 3 & 4: Hedge + Documents - Side by side on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 3. Hedge Position */}
                  {data.hedge && (
                    <div>
                      <HedgeCard hedge={data.hedge} />
                    </div>
                  )}

                  {/* 4. Documents */}
                  <div className={!data.hedge ? "lg:col-span-2" : ""}>
                    <DocumentsList documents={data.documents} />
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          ) : null}
        </div>
      </main>
    </div>
  );
}
