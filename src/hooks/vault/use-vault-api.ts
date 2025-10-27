"use client";

import { useMemo } from "react";
import { VaultEvent, VaultFundingInfo, EventTag } from "@/types/vault";
import { useVaultsAPI, useActivityAPI } from "@/hooks/api";
import {
  VITALFI_VAULT_PROGRAM_ID,
  getVaultPda,
  getCurrentNetwork,
} from "@/lib/sdk";
import { fromBaseUnits, parseTimestamp, toISOString } from "@/lib/api/formatters";
import { getTokenDecimals } from "@/lib/sdk/config";
import { env } from "@/lib/env";
import { SOL_DECIMALS, DEFAULT_ORIGINATOR } from "@/lib/utils/constants";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

// Computed values derived from vault info
interface ComputedVaultData {
  capRemainingSol: number;
  progressPct: number;
  status: VaultFundingInfo["status"];
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
 *
 * @param vaultId - The vault ID to fetch (required)
 */
export function useVaultAPI(vaultId: string): UseVaultReturn {
  // Get authority from environment
  const authority = env.vaultAuthority;

  // Fetch vaults from backend API
  const {
    data: vaultsResponse,
    isLoading,
    error: fetchError,
  } = useVaultsAPI({
    authority,
    status: undefined,
    limit: 100,
    enabled: !!authority,
  });

  // Find the specific vault by vaultId
  const vaultDTO = useMemo(() => {
    if (!vaultsResponse) return null;
    return vaultsResponse.items.find((v) => v.vaultId === vaultId);
  }, [vaultsResponse, vaultId]);

  // Derive vault PDA
  const vaultPda = useMemo(() => {
    if (!vaultDTO || !authority) return null;
    try {
      const authorityPubkey = new PublicKey(authority);
      const vaultIdBN = new BN(vaultId);
      const [pda] = getVaultPda(authorityPubkey, vaultIdBN);
      return pda;
    } catch (err) {
      console.error("Failed to derive vault PDA:", err);
      return null;
    }
  }, [vaultDTO, authority, vaultId]);

  // Transform DTO to UI format
  const info = useMemo<VaultFundingInfo | null>(() => {
    if (!vaultDTO || !vaultPda) return null;

    const decimals = vaultDTO.assetMint ? getTokenDecimals(vaultDTO.assetMint) : SOL_DECIMALS;

    const fundingEndDate = parseTimestamp(vaultDTO.fundingEndTs);
    const maturityDate = parseTimestamp(vaultDTO.maturityTs);

    return {
      status: vaultDTO.status,
      name: vaultId,
      expectedApyPct: vaultDTO.targetApyBps ? vaultDTO.targetApyBps / 100 : 0,
      capSol: fromBaseUnits(vaultDTO.cap, decimals),
      minInvestmentSol: fromBaseUnits(vaultDTO.minDeposit, decimals),
      raisedSol: fromBaseUnits(vaultDTO.totalDeposited, decimals),
      totalClaimedSol: fromBaseUnits(vaultDTO.totalClaimed, decimals),
      fundingEndAt: toISOString(fundingEndDate),
      maturityAt: toISOString(maturityDate),
      originator: DEFAULT_ORIGINATOR.name,
      payoutNum: vaultDTO.payoutNum,
      payoutDen: vaultDTO.payoutDen,
      addresses: {
        programId: VITALFI_VAULT_PROGRAM_ID.toBase58(),
        vaultPda: vaultDTO.vaultPda,
        authority: vaultDTO.authority,
        tokenMint: vaultDTO.assetMint || "",
        vaultTokenAccount: vaultDTO.vaultTokenAccount,
      },
    };
  }, [vaultDTO, vaultPda, vaultId]);

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
      const decimals = activity.assetMint ? getTokenDecimals(activity.assetMint) : SOL_DECIMALS;

      // Map activity types to display labels
      let tag: EventTag;
      let note: string;

      switch (activity.type) {
        case "deposit":
          tag = "Deposit";
          note = "Deposit";
          break;
        case "claim":
          tag = "Claim";
          note = "Claim";
          break;
        case "vault_created":
          tag = "System";
          note = "Vault Created";
          break;
        case "funding_finalized":
          tag = "System";
          note = "Funding Finalized";
          break;
        case "authority_withdraw":
          tag = "Withdraw";
          note = "Authority Withdraw";
          break;
        case "matured":
          tag = "System";
          note = "Vault Matured";
          break;
        case "vault_closed":
          tag = "System";
          note = "Vault Closed";
          break;
        default:
          tag = "System";
          note = activity.type;
      }

      return {
        id: activity.id,
        tag,
        ts: activity.blockTime || new Date().toISOString(),
        wallet: activity.owner || activity.authority || "Unknown",
        amountSol: fromBaseUnits(activity.amount, decimals),
        txUrl: `${baseUrl}/${activity.txSig}${cluster}`,
        note,
      };
    });
  }, [activityResponse]);

  const error = useMemo(() => {
    if (fetchError) {
      return fetchError instanceof Error
        ? fetchError.message
        : "Failed to fetch vault data";
    }
    if (!isLoading && !vaultDTO) {
      return `${vaultId} not found`;
    }
    return null;
  }, [fetchError, isLoading, vaultDTO, vaultId]);

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
      status: info.status,
      daysToMaturity,
      daysToFundingEnd,
      canDeposit: info.status === "Funding" && capRemainingSol > 0,
    };
  }, [info]);

  return {
    info,
    events,
    computed,
    error,
  };
}
