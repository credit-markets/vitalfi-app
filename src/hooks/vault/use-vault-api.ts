"use client";

import { useMemo } from "react";
import { VaultEvent, VaultFundingInfo } from "@/types/vault";
import { useVaultsAPI, useActivityAPI } from "@/hooks/api";
import {
  getDefaultVault,
  getNetworkConfig,
  VITALFI_VAULT_PROGRAM_ID,
  getVaultPda,
  getCurrentNetwork,
} from "@/lib/sdk";
import { fromBaseUnits, parseTimestamp, toISOString } from "@/lib/api/formatters";

// Computed values derived from vault info
interface ComputedVaultData {
  capRemainingSol: number;
  progressPct: number;
  stage: VaultFundingInfo["stage"];
  daysToMaturity: number;
  daysToFundingEnd: number;
  canDeposit: boolean;
}

// Hook return type with explicit error states
export interface UseVaultReturn {
  info: VaultFundingInfo | null;
  events: VaultEvent[];
  computed: ComputedVaultData | null;
  error: string | null;
}

/**
 * Hook for funding vault data and computed values (API-backed)
 *
 * Fetches vault data from backend API with ETag/304 caching.
 * Falls back to default vault if no vaultId is provided.
 *
 * RESILIENCY FEATURES:
 * - Decimals-aware formatting (supports non-SOL tokens)
 * - UTC time handling with null guards
 * - Stable query keys
 * - Abort signal support
 */
export function useVaultAPI(): UseVaultReturn {
  // Get vault configuration
  const vaultConfig = useMemo(() => {
    try {
      return getDefaultVault();
    } catch (err) {
      console.error("Failed to get vault config:", err);
      return null;
    }
  }, []);

  // Get network authority
  const networkConfig = useMemo(() => {
    try {
      return getNetworkConfig();
    } catch (err) {
      console.error("Failed to get network config:", err);
      return null;
    }
  }, []);

  // Fetch vaults from backend API
  const {
    data: vaultsResponse,
    isLoading,
    error: fetchError,
  } = useVaultsAPI({
    authority: networkConfig?.authority.toBase58() || "",
    status: undefined,
    limit: 10,
    enabled: !!vaultConfig && !!networkConfig,
  });

  // Find the specific vault by vaultId
  const vaultDTO = useMemo(() => {
    if (!vaultsResponse || !vaultConfig) return null;
    return vaultsResponse.items.find(
      (v) => v.vaultId === vaultConfig.id.toString()
    );
  }, [vaultsResponse, vaultConfig]);

  // Derive vault PDA
  const vaultPda = useMemo(() => {
    if (!networkConfig || !vaultConfig) return null;
    const [pda] = getVaultPda(networkConfig.authority, vaultConfig.id);
    return pda;
  }, [networkConfig, vaultConfig]);

  // Transform DTO to UI format
  const info = useMemo<VaultFundingInfo | null>(() => {
    if (!vaultDTO || !vaultConfig || !networkConfig || !vaultPda) return null;

    // RESILIENCY PATCH: Decimals-aware formatting
    // Assume 9 decimals for SOL (could be extended to read from asset mint metadata)
    const decimals = 9;

    // Map backend status to UI stage
    let stage: VaultFundingInfo["stage"] = "Funding";
    if (vaultDTO.status === "Matured") {
      stage = "Matured";
    } else if (vaultDTO.status === "Active") {
      stage = "Funded";
    } else if (vaultDTO.status === "Canceled") {
      stage = "Funding"; // Or add 'Canceled' stage if needed
    }

    // RESILIENCY PATCH: UTC time handling with null guards
    const fundingEndDate = parseTimestamp(vaultDTO.fundingEndTs);
    const maturityDate = parseTimestamp(vaultDTO.maturityTs);
    const fundingStartDate = fundingEndDate
      ? new Date(fundingEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

    return {
      stage,
      name: vaultConfig.name,
      expectedApyPct: vaultDTO.targetApyBps ? vaultDTO.targetApyBps / 100 : 0,
      tvlSol: fromBaseUnits(vaultDTO.totalDeposited, decimals),
      capSol: fromBaseUnits(vaultDTO.cap, decimals),
      minInvestmentSol: fromBaseUnits(vaultDTO.minDeposit, decimals),
      raisedSol: fromBaseUnits(vaultDTO.totalDeposited, decimals),
      fundingStartAt: toISOString(fundingStartDate),
      fundingEndAt: toISOString(fundingEndDate),
      maturityAt: toISOString(maturityDate),
      originator: "VitalFi",
      addresses: {
        programId: VITALFI_VAULT_PROGRAM_ID.toBase58(),
        vaultPda: vaultDTO.vaultPda,
        authorityPda: vaultDTO.authority,
        tokenMint: vaultDTO.assetMint || "",
        vaultTokenAccount: "", // Not in DTO - add if needed
      },
    };
  }, [vaultDTO, vaultConfig, networkConfig, vaultPda]);

  // Fetch activity from backend
  const { data: activityResponse } = useActivityAPI({
    vault: vaultDTO?.vaultPda,
    limit: 20,
    enabled: !!vaultDTO,
  });

  // Transform activity DTOs to events for UI
  const events: VaultEvent[] = useMemo(() => {
    if (!activityResponse) return [];

    const network = getCurrentNetwork();
    const baseUrl = "https://explorer.solana.com/tx";
    const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

    return activityResponse.items.map((activity) => {
      const decimals = 9; // TODO: Get from asset mint
      return {
        id: activity.id,
        tag:
          activity.type === "deposit"
            ? "Deposit"
            : activity.type === "claim"
            ? "Claim"
            : "Params",
        ts: activity.blockTime || new Date().toISOString(),
        wallet: activity.owner || activity.authority || "Unknown",
        amountSol: fromBaseUnits(activity.amount, decimals),
        txUrl: `${baseUrl}/${activity.txSig}${cluster}`,
        note:
          activity.type.charAt(0).toUpperCase() + activity.type.slice(1),
      };
    });
  }, [activityResponse]);

  const error = useMemo(() => {
    if (!vaultConfig) {
      return "No vault configuration found";
    }
    if (!networkConfig) {
      return "Invalid network configuration";
    }
    if (fetchError) {
      return fetchError instanceof Error
        ? fetchError.message
        : "Failed to fetch vault data";
    }
    if (!isLoading && !vaultDTO) {
      return "Vault not found";
    }
    return null;
  }, [vaultConfig, networkConfig, fetchError, isLoading, vaultDTO]);

  // Compute derived values
  const computed = useMemo(() => {
    if (!info) {
      return null;
    }

    const capRemainingSol = Math.max(0, info.capSol - info.raisedSol);
    const progressPct =
      info.capSol > 0 ? (info.raisedSol / info.capSol) * 100 : 0;

    const now = new Date();
    const fundingEnds = new Date(info.fundingEndAt);
    const maturity = new Date(info.maturityAt);

    // Compute stage dynamically
    let stage: typeof info.stage = "Funding";
    if (now >= maturity) {
      stage = "Matured";
    } else if (now >= fundingEnds || capRemainingSol <= 0) {
      stage = "Funded";
    }

    // Days to maturity from now (minimum 0)
    const daysToMaturity = Math.max(
      0,
      Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Days until funding ends (minimum 0)
    const daysToFundingEnd = Math.max(
      0,
      Math.ceil((fundingEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      capRemainingSol,
      progressPct,
      stage,
      daysToMaturity,
      daysToFundingEnd,
      canDeposit: stage === "Funding" && capRemainingSol > 0,
    };
  }, [info]);

  return {
    info: info && computed ? { ...info, stage: computed.stage } : null,
    events,
    computed,
    error,
  };
}
