"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { VaultFacts } from "@/components/transparency/VaultFacts";
import { CollateralSection } from "@/components/transparency/CollateralSection";
import { HedgeCard } from "@/components/transparency/HedgeCard";
import { DocumentsList } from "@/components/transparency/DocumentsList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useSidebar } from "@/providers/SidebarContext";
import { useVaultAPI, useTransparency } from "@/hooks/vault";
import { exportReceivablesCsv } from "@/lib/transparency/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Receivable, VaultSummary } from "@/types/vault";
import { DEFAULT_ORIGINATOR } from "@/lib/utils/constants";

// Safari requires a delay before revoking blob URLs to ensure download starts
const SAFARI_DOWNLOAD_DELAY_MS = 100;

// Tab styling design with bottom border
const TAB_TRIGGER_CLASSES =
  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3";

export default function VaultTransparencyDetail() {
  const params = useParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const vaultId = params.vaultId as string;
  const [activeTab, setActiveTab] = useState("collateral");
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Fetch vault data from backend API
  const { info: vaultInfo, error: vaultError } = useVaultAPI(vaultId);

  // Convert VaultFundingInfo to VaultSummary
  const vaultSummary = useMemo<VaultSummary | null>(() => {
    if (!vaultInfo) return null;

    return {
      id: vaultId,
      title: vaultInfo.name,
      status: vaultInfo.status,
      raised: vaultInfo.raisedSol,
      cap: vaultInfo.capSol,
      targetApy: vaultInfo.expectedApyPct / 100, // Convert percentage to decimal
      maturityDate: vaultInfo.maturityAt,
      originator: DEFAULT_ORIGINATOR,
      assetMint: vaultInfo.addresses.tokenMint,
    };
  }, [vaultInfo, vaultId]);

  // Fetch transparency data (with fallback to mock data)
  const {
    data: transparencyData,
    isLoading,
    error: transparencyError,
  } = useTransparency({
    vaultPda: vaultId,
    vaultSummary,
    enabled: !!vaultSummary,
  });

  const handleExportCsv = (receivables: Receivable[]) => {
    try {
      // Early validation for empty receivables
      if (!receivables || receivables.length === 0) {
        toast.error("No receivables to export");
        return;
      }

      const blob = exportReceivablesCsv(vaultId, receivables);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${vaultId}-receivables-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up previous export if any
      cleanupRef.current?.();

      // Store timeout ID for cleanup
      const timeoutId = setTimeout(() => {
        window.URL.revokeObjectURL(url);
        cleanupRef.current = null;
      }, SAFARI_DOWNLOAD_DELAY_MS);

      cleanupRef.current = () => {
        clearTimeout(timeoutId);
        window.URL.revokeObjectURL(url);
      };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to export CSV");
      console.error("Error exporting CSV:", error, {
        vaultId,
        receivablesCount: receivables.length,
      });
      toast.error(error.message, {
        description:
          "Please try again or contact support if the issue persists.",
      });
    }
  };

  const error = vaultError || transparencyError;

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
            <Link href={`/vault/${vaultId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vault
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="h-40 bg-card border border-border rounded-lg animate-pulse" />
              <div className="h-96 bg-card border border-border rounded-lg animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 text-lg mb-2">
                Error loading vault data
              </p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button
                className="mt-4"
                onClick={() => router.push(`/vault/${vaultId}`)}
              >
                Return to Vault
              </Button>
            </div>
          ) : transparencyData ? (
            <ErrorBoundary>
              <div className="space-y-6">
                {/* Vault Facts - Always visible at top */}
                <VaultFacts
                  summary={transparencyData.summary}
                  lastUpdated={transparencyData.lastUpdated}
                />

                {/* Tabbed Navigation for Collateral, Hedge, and Documents */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
                    <TabsTrigger
                      value="collateral"
                      className={TAB_TRIGGER_CLASSES}
                    >
                      Collateral
                    </TabsTrigger>
                    {transparencyData.hedge && (
                      <TabsTrigger
                        value="hedge"
                        className={TAB_TRIGGER_CLASSES}
                      >
                        Hedge Position
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="documents"
                      className={TAB_TRIGGER_CLASSES}
                    >
                      Documents
                    </TabsTrigger>
                  </TabsList>

                  {/* Collateral Tab - Overview + Receivables List */}
                  <TabsContent value="collateral">
                    <CollateralSection
                      analytics={transparencyData.collateral.analytics}
                      receivables={transparencyData.collateral.items}
                      onExportCsv={handleExportCsv}
                    />
                  </TabsContent>

                  {/* Hedge Tab */}
                  {transparencyData.hedge && (
                    <TabsContent value="hedge">
                      <HedgeCard hedge={transparencyData.hedge} />
                    </TabsContent>
                  )}

                  {/* Documents Tab */}
                  <TabsContent value="documents">
                    <DocumentsList documents={transparencyData.documents} />
                  </TabsContent>
                </Tabs>
              </div>
            </ErrorBoundary>
          ) : null}
        </div>
      </main>
    </div>
  );
}
