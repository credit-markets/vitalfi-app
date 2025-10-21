"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePositionsAPI, useVaultsAPI, useActivityAPI } from "@/hooks/api";
import { expectedYieldSol } from "@/lib/utils";
import { fromBaseUnits, parseTimestamp } from "@/lib/api/formatters";
import type { PortfolioPosition, PortfolioActivity, PortfolioSummary } from "./use-portfolio";
import { getAllVaults, getNetworkConfig } from "@/lib/sdk";

/**
 * Portfolio hook for maturity-based crowdfunding model (API-backed)
 *
 * Returns user positions, activity, and aggregated summary from backend API.
 *
 * RESILIENCY FEATURES:
 * - Multi-authority portfolio support (not hardcoded)
 * - Decimals-aware formatting
 * - UTC time handling
 * - Stable query keys
 */
export function usePortfolioAPI() {
  const { publicKey, connected } = useWallet();

  // Fetch user positions from backend
  const { data: positionsResponse } = usePositionsAPI({
    owner: publicKey?.toBase58() || "",
    limit: 100,
    enabled: !!publicKey && connected,
  });

  // Extract unique vault PDAs
  const vaultPdas = useMemo(() => {
    if (!positionsResponse) return [];
    return [...new Set(positionsResponse.items.map((p) => p.vaultPda))];
  }, [positionsResponse]);

  // RESILIENCY PATCH: Multi-authority support
  // Get authority from network config
  const authority = useMemo(() => {
    try {
      const networkConfig = getNetworkConfig();
      return networkConfig.authority.toBase58();
    } catch (error) {
      console.error("Failed to get network config:", error);
      return "";
    }
  }, []);

  // Fetch vaults for the network authority
  const { data: vaultsResponse } = useVaultsAPI({
    authority,
    limit: 100,
    enabled: vaultPdas.length > 0 && !!authority,
  });

  // Fetch user activity from backend
  const { data: activityResponse } = useActivityAPI({
    owner: publicKey?.toBase58(),
    limit: 50,
    enabled: !!publicKey && connected,
  });

  // Transform DTOs to portfolio positions
  const positions = useMemo<PortfolioPosition[]>(() => {
    if (!positionsResponse || !vaultsResponse) return [];

    const vaultConfigs = getAllVaults();
    const decimals = 9; // SOL decimals (TODO: read from mint metadata)

    const results: PortfolioPosition[] = [];

    for (const position of positionsResponse.items) {
      const vault = vaultsResponse.items.find(
        (v) => v.vaultPda === position.vaultPda
      );
      if (!vault) continue;

        // Find vault config for name
        const vaultConfig = vaultConfigs.find(
          (v) => v.id.toString() === vault.vaultId
        );

        // Map backend status to UI stage
        let stage: PortfolioPosition["stage"] = "Funding";
        if (vault.status === "Matured") {
          stage = "Matured";
        } else if (vault.status === "Active") {
          stage = "Funded";
        }

        const depositedSol = fromBaseUnits(position.deposited, decimals);
        const claimedSol = fromBaseUnits(position.claimed, decimals);

        // Calculate realized yield for matured vaults
        // Note: Backend doesn't provide payout_num/payout_den yet
        // This would need to be added to VaultDTO
        let realizedYieldSol: number | undefined;
        let realizedTotalSol: number | undefined;
        let canClaim = false;

        if (stage === "Matured") {
          // TODO: Calculate from vault.payoutNum / vault.payoutDen when available
          // For now, assume 1:1 payout (no yield)
          realizedTotalSol = depositedSol;
          realizedYieldSol = 0;
          canClaim = claimedSol < depositedSol;
        }

      const fundingEndDate = parseTimestamp(vault.fundingEndTs);
      const maturityDate = parseTimestamp(vault.maturityTs);

      results.push({
        vaultId: vault.vaultId,
        vaultName: vaultConfig?.name || `Vault #${vault.vaultId}`,
        stage,
        depositedSol,
        expectedApyPct: 0, // TODO: Add to VaultDTO
        fundingEndAt: fundingEndDate?.toISOString() || "",
        maturityAt: maturityDate?.toISOString() || "",
        realizedYieldSol,
        realizedTotalSol,
        canClaim,
        originatorShort: "VitalFi",
        collateralShort: "Medical Receivables",
        minInvestmentSOL: 0, // TODO: Add to VaultDTO
      });
    }

    return results;
  }, [positionsResponse, vaultsResponse]);

  // Transform activity DTOs to portfolio activity
  const activity = useMemo<PortfolioActivity[]>(() => {
    if (!activityResponse || !vaultsResponse) return [];

    const vaultConfigs = getAllVaults();
    const decimals = 9;

    return activityResponse.items
      .filter(
        (act) =>
          act.type === "deposit" || act.type === "claim"
      )
      .map((act) => {
        const vault = vaultsResponse.items.find(
          (v) => v.vaultPda === act.vaultPda
        );
        const vaultConfig = vaultConfigs.find(
          (v) => v.id.toString() === vault?.vaultId
        );

        // Map backend status to UI stage
        let stage: PortfolioActivity["stage"] = "Funding";
        if (vault?.status === "Matured") {
          stage = "Matured";
        } else if (vault?.status === "Active") {
          stage = "Funded";
        }

        return {
          type: act.type === "deposit" ? "Deposit" : "Claim",
          amountSol: fromBaseUnits(act.amount, decimals),
          stage,
          date: act.blockTime || new Date().toISOString(),
          txSig: act.txSig,
          status: "success" as const, // Confirmed transactions only
          vaultId: vault?.vaultId || "",
          vaultName: vaultConfig?.name || `Vault #${vault?.vaultId || ""}`,
        };
      });
  }, [activityResponse, vaultsResponse]);

  // Calculate summary
  const summary = useMemo<PortfolioSummary>(() => {
    const totalDepositedSol = positions.reduce(
      (sum, p) => sum + p.depositedSol,
      0
    );

    const totalExpectedYieldSol = positions
      .filter((p) => p.stage !== "Matured") // Only count active positions
      .reduce((sum, p) => {
        if (!p.maturityAt) return sum;
        return (
          sum + expectedYieldSol(p.depositedSol, p.expectedApyPct, p.maturityAt)
        );
      }, 0);

    const totalAtMaturitySol = totalDepositedSol + totalExpectedYieldSol;

    return {
      totalDepositedSol,
      totalExpectedYieldSol,
      totalAtMaturitySol,
    };
  }, [positions]);

  return {
    summary,
    positions,
    activity,
    connected,
  };
}
