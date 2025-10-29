"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePositionsAPI, useVaultsAPI, useActivityAPI } from "@/hooks/api";
import { expectedYieldSol } from "@/lib/utils";
import { fromBaseUnits, parseTimestamp } from "@/lib/api/formatters";
import { getTokenDecimals } from "@/lib/sdk/config";
import { env } from "@/lib/env";
import { SOL_DECIMALS, DEFAULT_ORIGINATOR, DEFAULT_COLLATERAL_TYPE } from "@/lib/utils/constants";
import type { VaultStatus } from "@/types/vault";

export type PortfolioPosition = {
  vaultId: string;
  vaultName: string;
  status: VaultStatus;
  depositedSol: number;
  expectedApyPct: number;
  fundingEndAt: string; // ISO
  maturityAt: string;   // ISO
  // when matured:
  realizedYieldSol?: number;
  realizedTotalSol?: number;
  canClaim?: boolean;
  claimTxSig?: string;
  // metadata
  originatorShort: string;
  collateralShort: string;
  minInvestmentSOL?: number;
  assetMint?: string;
};

export type PortfolioActivity = {
  type: 'Deposit' | 'Claim' | 'Vault Created' | 'Funding Finalized' | 'Matured' | 'Vault Closed' | 'System';
  amountSol: number;
  vaultStatus: VaultStatus;
  date: string;
  txSig: string;
  status: 'success'; // Backend only returns confirmed transactions
  vaultId: string;
  vaultName: string;
  assetMint?: string;
};

export type PortfolioSummary = {
  totalDepositedSol: number;
  totalExpectedYieldSol: number; // across active positions
  totalAtMaturitySol: number;
  averageApyPct: number; // weighted average APY across active positions
};

/**
 * Portfolio hook for maturity-based crowdfunding model (API-backed)
 *
 * Returns user positions, activity, and aggregated summary from backend API.
 *
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

  // Get authority from environment
  const authority = env.vaultAuthority;

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

    const results: PortfolioPosition[] = [];

    for (const position of positionsResponse.items) {
      const vault = vaultsResponse.items.find(
        (v) => v.vaultPda === position.vaultPda
      );
      if (!vault) continue;

      const decimals = vault.assetMint ? getTokenDecimals(vault.assetMint) : SOL_DECIMALS;
      const depositedSol = fromBaseUnits(position.deposited, decimals);
      const claimedSol = fromBaseUnits(position.claimed, decimals);

      // Calculate realized yield for matured vaults
      let realizedYieldSol: number | undefined;
      let realizedTotalSol: number | undefined;
      let canClaim = false;

      if (vault.status === "Matured") {
        // Calculate actual payout using vault.payoutNum / vault.payoutDen
        // Formula: userPayout = floor(deposited * payoutNum / payoutDen)
        // Example: deposited 400, payoutNum=770, payoutDen=700 → 440 (57.1% return)

        if (vault.payoutNum && vault.payoutDen) {
          // Parse payout ratio from strings (u128 values)
          const payoutNum = BigInt(vault.payoutNum);
          const payoutDen = BigInt(vault.payoutDen);

          // Avoid division by zero
          if (payoutDen > 0n) {
            // Use original deposited amount from DTO (string in base units) to avoid precision loss
            const depositedBaseUnits = BigInt(position.deposited || '0');

            // Calculate payout in base units: floor(deposited * payoutNum / payoutDen)
            const payoutBaseUnits = (depositedBaseUnits * payoutNum) / payoutDen;

            // Convert back to SOL
            realizedTotalSol = Number(payoutBaseUnits) / 10 ** decimals;
            realizedYieldSol = realizedTotalSol - depositedSol;
            canClaim = claimedSol < realizedTotalSol;
          } else {
            // Invalid state: payout denominator is 0
            console.error(`Vault ${vault.vaultId}: Invalid payout denominator (0)`);
            realizedTotalSol = depositedSol;
            realizedYieldSol = 0;
            canClaim = claimedSol < depositedSol;
          }
        } else {
          // Fallback: payout ratio not set (vault matured before authority called matureVault)
          // Assume 1:1 payout (no yield)
          realizedTotalSol = depositedSol;
          realizedYieldSol = 0;
          canClaim = claimedSol < depositedSol;
        }
      } else if (vault.status === "Canceled") {
        // For canceled vaults, users can claim full refund of their deposit
        canClaim = claimedSol < depositedSol;
      }

      const fundingEndDate = parseTimestamp(vault.fundingEndTs);
      const maturityDate = parseTimestamp(vault.maturityTs);
      const minInvestmentSol = fromBaseUnits(vault.minDeposit, decimals);

      results.push({
        vaultId: vault.vaultId,
        vaultName: vault.vaultId,
        status: vault.status,
        depositedSol,
        expectedApyPct: vault.targetApyBps ? vault.targetApyBps / 100 : 0,
        fundingEndAt: fundingEndDate?.toISOString() || "",
        maturityAt: maturityDate?.toISOString() || "",
        realizedYieldSol,
        realizedTotalSol,
        canClaim,
        originatorShort: DEFAULT_ORIGINATOR.name,
        collateralShort: DEFAULT_COLLATERAL_TYPE,
        minInvestmentSOL: minInvestmentSol,
        assetMint: vault.assetMint || undefined,
      });
    }

    return results;
  }, [positionsResponse, vaultsResponse]);

  // Map backend activity types to display names
  const mapActivityType = (type: string): PortfolioActivity['type'] => {
    switch (type) {
      case "deposit":
        return "Deposit";
      case "claim":
        return "Claim";
      case "vault_created":
        return "Vault Created";
      case "funding_finalized":
        return "Funding Finalized";
      case "matured":
        return "Matured";
      case "vault_closed":
        return "Vault Closed";
      case "authority_withdraw":
        return "System";
      default:
        return "System";
    }
  };

  // Transform activity DTOs to portfolio activity
  const activity = useMemo<PortfolioActivity[]>(() => {
    if (!activityResponse || !vaultsResponse) return [];

    return activityResponse.items.map((act) => {
      const vault = vaultsResponse.items.find(
        (v) => v.vaultPda === act.vaultPda
      );
      const decimals = act.assetMint ? getTokenDecimals(act.assetMint) : SOL_DECIMALS;

      return {
        type: mapActivityType(act.type),
        amountSol: act.amount ? fromBaseUnits(act.amount, decimals) : 0,
        vaultStatus: vault?.status || 'Funding',
        date: act.blockTime || new Date().toISOString(),
        txSig: act.txSig,
        status: "success" as const,
        vaultId: vault?.vaultId || "",
        vaultName: vault?.vaultId || "",
        assetMint: act.assetMint || undefined,
      };
    });
  }, [activityResponse, vaultsResponse]);

  // Calculate summary
  const summary = useMemo<PortfolioSummary>(() => {
    // Only count deposited amount for positions that haven't been fully claimed/refunded
    const totalDepositedSol = positions
      .filter((p) => {
        // Exclude positions that have been claimed (Matured/Canceled/Closed with no claimable balance)
        if (p.status === "Closed") return false;
        if ((p.status === "Matured" || p.status === "Canceled") && !p.canClaim) return false;
        return true;
      })
      .reduce((sum, p) => sum + p.depositedSol, 0);

    const totalExpectedYieldSol = positions
      .filter((p) => p.status !== "Matured" && p.status !== "Canceled" && p.status !== "Closed") // Only count active positions
      .reduce((sum, p) => {
        if (!p.maturityAt || !p.fundingEndAt) return sum;
        return (
          sum + expectedYieldSol(p.depositedSol, p.expectedApyPct, p.maturityAt, p.fundingEndAt)
        );
      }, 0);

    const totalAtMaturitySol = totalDepositedSol + totalExpectedYieldSol;

    // Calculate weighted average APY across active positions
    const activePositions = positions.filter(
      (p) => p.status !== "Matured" && p.status !== "Canceled" && p.status !== "Closed"
    );

    const averageApyPct =
      activePositions.length > 0
        ? activePositions.reduce(
            (sum, p) => sum + p.expectedApyPct * p.depositedSol,
            0
          ) / totalDepositedSol
        : 0;

    return {
      totalDepositedSol,
      totalExpectedYieldSol,
      totalAtMaturitySol,
      averageApyPct,
    };
  }, [positions]);

  return {
    summary,
    positions,
    activity,
    connected,
    vaults: vaultsResponse?.items || [],
  };
}
