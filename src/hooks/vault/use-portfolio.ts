"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { expectedYieldSol } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useVaultClient } from "@/hooks/wallet";
import { getAllVaults } from "@/lib/sdk";
import BN from "bn.js";

export type PortfolioPosition = {
  vaultId: string;
  vaultName: string;
  stage: 'Funding' | 'Funded' | 'Matured';
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
};

export type PortfolioActivity = {
  type: 'Deposit' | 'Claim';
  amountSol: number;
  stage: 'Funding' | 'Funded' | 'Matured';
  date: string;
  txSig: string;
  status: 'success' | 'pending' | 'failed';
  vaultId: string;
  vaultName: string;
};

export type PortfolioSummary = {
  totalDepositedSol: number;
  totalExpectedYieldSol: number; // across active positions
  totalAtMaturitySol: number;
};

/**
 * Portfolio hook for maturity-based crowdfunding model
 * Returns user positions, activity, and aggregated summary
 */
export function usePortfolio() {
  const { publicKey, connected } = useWallet();
  const client = useVaultClient();

  // Fetch all user positions across vaults
  const { data: userPositions = [] } = useQuery({
    queryKey: ['user-all-positions', publicKey?.toBase58()],
    queryFn: async () => {
      if (!client || !publicKey) return [];

      // Get all positions for the user
      const positions = await client.getUserPositions(publicKey);
      return positions;
    },
    enabled: !!client && !!publicKey && connected,
    staleTime: 30_000, // 30 seconds
  });

  // Fetch vault data for each position
  const { data: vaultsData = [] } = useQuery({
    queryKey: ['portfolio-vaults', userPositions.map(p => p.pubkey.toBase58()).join(',')],
    queryFn: async () => {
      if (!client || userPositions.length === 0) return [];

      const vaultsPromises = userPositions.map(async ({ account }) => {
        try {
          const vault = await client.getVaultByPda(account.vault);
          return vault ? { vault, position: account } : null;
        } catch (err) {
          console.error('Failed to fetch vault:', err);
          return null;
        }
      });

      const results = await Promise.all(vaultsPromises);
      return results.filter((r): r is NonNullable<typeof r> => r !== null);
    },
    enabled: !!client && userPositions.length > 0,
    staleTime: 30_000,
  });

  // Transform on-chain data to portfolio positions
  const positions = useMemo<PortfolioPosition[]>(() => {
    if (!vaultsData || vaultsData.length === 0) return [];

    const vaultConfigs = getAllVaults();

    return vaultsData.map(({ vault, position }) => {
      // Helper to convert lamports to SOL
      const lamportsToSol = (lamports: BN): number => lamports.toNumber() / 1e9;

      // Find vault config for name
      const vaultConfig = vaultConfigs.find(v => v.id.eq(vault.vaultId));

      // Map status to stage
      let stage: PortfolioPosition['stage'] = 'Funding';
      const statusKey = Object.keys(vault.status)[0];
      if (statusKey === 'matured') {
        stage = 'Matured';
      } else if (statusKey === 'active') {
        stage = 'Funded';
      }

      // Calculate realized yield for matured vaults
      let realizedYieldSol: number | undefined;
      let realizedTotalSol: number | undefined;
      let canClaim = false;

      if (stage === 'Matured' && vault.payoutNum.gt(new BN(0))) {
        // Calculate entitled amount
        const entitled = position.deposited
          .mul(vault.payoutNum)
          .div(vault.payoutDen);
        const entitledSol = lamportsToSol(entitled);
        const depositedSol = lamportsToSol(position.deposited);

        realizedYieldSol = entitledSol - depositedSol;
        realizedTotalSol = entitledSol;
        canClaim = position.claimed.lt(entitled);
      }

      return {
        vaultId: vault.vaultId.toString(),
        vaultName: vaultConfig?.name || `Vault #${vault.vaultId.toString()}`,
        stage,
        depositedSol: lamportsToSol(position.deposited),
        expectedApyPct: vault.targetApyBps / 100,
        fundingEndAt: new Date(vault.fundingEndTs.toNumber() * 1000).toISOString(),
        maturityAt: new Date(vault.maturityTs.toNumber() * 1000).toISOString(),
        realizedYieldSol,
        realizedTotalSol,
        canClaim,
        originatorShort: 'VitalFi',
        collateralShort: 'Medical Receivables',
        minInvestmentSOL: lamportsToSol(vault.minDeposit),
      };
    });
  }, [vaultsData]);

  // Activity is still mocked - would need indexer/API for this
  const activity = useMemo<PortfolioActivity[]>(() => {
    // TODO: Implement with transaction history from indexer
    return [];
  }, []);

  const summary = useMemo<PortfolioSummary>(() => {
    const totalDepositedSol = positions.reduce((sum, p) => sum + p.depositedSol, 0);

    const totalExpectedYieldSol = positions
      .filter(p => p.stage !== 'Matured') // Only count active positions
      .reduce((sum, p) => {
        return sum + expectedYieldSol(p.depositedSol, p.expectedApyPct, p.maturityAt);
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
