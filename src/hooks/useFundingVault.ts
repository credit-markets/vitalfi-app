"use client";

import { useMemo } from 'react';
import { VaultEvent, VaultFundingInfo } from '@/types/vault';
import { useVault, useVaultTransactions } from '@/lib/vault-hooks';
import { getDefaultVault, getNetworkConfig, VITALFI_VAULT_PROGRAM_ID, getVaultPda, getCurrentNetwork } from '@/lib/vault-sdk';
import BN from 'bn.js';

// Computed values derived from vault info
interface ComputedVaultData {
  capRemainingSol: number;
  progressPct: number;
  stage: VaultFundingInfo['stage'];
  daysToMaturity: number;
  daysToFundingEnd: number;
  canDeposit: boolean;
}

// Hook return type with explicit error states
interface UseFundingVaultReturn {
  info: VaultFundingInfo | null;
  events: VaultEvent[];
  computed: ComputedVaultData | null;
  error: string | null;
}

/**
 * Hook for funding vault data and computed values
 *
 * Fetches real on-chain vault data and transforms it into the UI format.
 * Falls back to default vault if no vaultId is provided.
 */
export function useFundingVault(): UseFundingVaultReturn {
  // Get vault configuration
  const vaultConfig = useMemo(() => {
    try {
      return getDefaultVault();
    } catch (err) {
      console.error('Failed to get vault config:', err);
      return null;
    }
  }, []);

  // Get network authority
  const networkConfig = useMemo(() => {
    try {
      return getNetworkConfig();
    } catch (err) {
      console.error('Failed to get network config:', err);
      return null;
    }
  }, []);

  // Fetch on-chain vault data
  const {
    data: vaultAccount,
    isLoading,
    error: fetchError,
  } = useVault(
    networkConfig?.authority || null,
    vaultConfig?.id || null,
    {
      enabled: !!vaultConfig && !!networkConfig,
    }
  );

  // Derive vault PDA
  const vaultPda = useMemo(() => {
    if (!networkConfig || !vaultConfig) return null;
    const [pda] = getVaultPda(networkConfig.authority, vaultConfig.id);
    return pda;
  }, [networkConfig, vaultConfig]);

  // Transform on-chain data to UI format
  const info = useMemo<VaultFundingInfo | null>(() => {
    if (!vaultAccount || !vaultConfig || !networkConfig || !vaultPda) {
      return null;
    }

    // Convert lamports to SOL (9 decimals)
    const lamportsToSol = (lamports: BN): number => {
      return lamports.toNumber() / 1e9;
    };

    // Map on-chain status to UI stage
    let stage: VaultFundingInfo['stage'] = 'Funding';
    const statusKey = Object.keys(vaultAccount.status)[0];
    if (statusKey === 'matured') {
      stage = 'Matured';
    } else if (statusKey === 'active') {
      stage = 'Funded';
    } else if (statusKey === 'canceled') {
      stage = 'Funding'; // Or 'Canceled' if you add that stage
    }

    // Convert timestamps to ISO strings
    const fundingEndAt = new Date(vaultAccount.fundingEndTs.toNumber() * 1000).toISOString();
    const maturityAt = new Date(vaultAccount.maturityTs.toNumber() * 1000).toISOString();
    const fundingStartAt = new Date(vaultAccount.fundingEndTs.toNumber() * 1000 - 30 * 24 * 60 * 60 * 1000).toISOString(); // Assume 30 days before funding end

    // Calculate APY from target_apy_bps (basis points)
    const expectedApyPct = vaultAccount.targetApyBps / 100; // Convert basis points to percentage

    return {
      stage,
      name: vaultConfig.name,
      expectedApyPct,
      tvlSol: lamportsToSol(vaultAccount.totalDeposited),
      capSol: lamportsToSol(vaultAccount.cap),
      minInvestmentSol: lamportsToSol(vaultAccount.minDeposit),
      raisedSol: lamportsToSol(vaultAccount.totalDeposited),
      fundingStartAt,
      fundingEndAt,
      maturityAt,
      originator: 'VitalFi',
      addresses: {
        programId: VITALFI_VAULT_PROGRAM_ID.toBase58(),
        vaultPda: vaultPda.toBase58(),
        authorityPda: networkConfig.authority.toBase58(),
        tokenMint: vaultAccount.assetMint.toBase58(),
        vaultTokenAccount: vaultAccount.vaultToken.toBase58(),
      },
    };
  }, [vaultAccount, vaultConfig, networkConfig, vaultPda]);

  const error = useMemo(() => {
    if (!vaultConfig) {
      return 'No vault configuration found';
    }
    if (!networkConfig) {
      return 'Invalid network configuration';
    }
    if (fetchError) {
      return fetchError.message || 'Failed to fetch vault data';
    }
    if (!isLoading && !vaultAccount) {
      return 'Vault not found on-chain';
    }
    return null;
  }, [vaultConfig, networkConfig, fetchError, isLoading, vaultAccount]);

  // Fetch real transaction history
  const { data: transactions = [] } = useVaultTransactions(vaultPda, 20);

  // Transform transactions to events for UI
  const events: VaultEvent[] = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const network = getCurrentNetwork();
    const baseUrl = "https://explorer.solana.com/tx";
    const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;

    return transactions.map((tx) => ({
      id: tx.signature,
      tag: tx.type === "deposit" ? "Deposit" : tx.type === "claim" ? "Claim" : "Params",
      ts: new Date(tx.timestamp * 1000).toISOString(),
      wallet: tx.user?.toBase58() || "Unknown",
      amountSol: tx.amount ? tx.amount.toNumber() / 1e9 : 0,
      txUrl: `${baseUrl}/${tx.signature}${cluster}`,
      note: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
    }));
  }, [transactions]);

  // Compute derived values
  const computed = useMemo(() => {
    if (!info) {
      return null;
    }

    const capRemainingSol = Math.max(0, info.capSol - info.raisedSol);
    const progressPct = info.capSol > 0 ? (info.raisedSol / info.capSol) * 100 : 0;

    const now = new Date();
    const fundingEnds = new Date(info.fundingEndAt);
    const maturity = new Date(info.maturityAt);

    // Compute stage dynamically
    let stage: typeof info.stage = 'Funding';
    if (now >= maturity) {
      stage = 'Matured';
    } else if (now >= fundingEnds || capRemainingSol <= 0) {
      stage = 'Funded';
    }

    // Days to maturity from now (minimum 0)
    const daysToMaturity = Math.max(0, Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Days until funding ends (minimum 0)
    const daysToFundingEnd = Math.max(0, Math.ceil((fundingEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      capRemainingSol,
      progressPct,
      stage,
      daysToMaturity,
      daysToFundingEnd,
      canDeposit: stage === 'Funding' && capRemainingSol > 0,
    };
  }, [info]);

  return {
    info: info && computed ? { ...info, stage: computed.stage } : null,
    events,
    computed,
    error,
  };
}
