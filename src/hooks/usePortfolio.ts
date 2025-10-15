"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { expectedYieldSol } from "@/lib/utils";

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

  const { positions, activity } = useMemo(() => {
    if (!connected || !publicKey) {
      return { positions: [], activity: [] };
    }

    // TODO: Replace with actual on-chain data fetching
    // For now, using mock data that matches the funding vault model

    const mockPositions: PortfolioPosition[] = [
      {
        vaultId: "vault-1",
        vaultName: "Medical Receivables Brazil Q4 2025",
        stage: "Funded",
        depositedSol: 50000,
        expectedApyPct: 12.0,
        fundingEndAt: "2025-11-15T23:59:59Z",
        maturityAt: "2026-04-15T00:00:00Z",
        originatorShort: "MedReceivables Brazil",
        collateralShort: "Collateral",
        minInvestmentSOL: 100,
      },
      {
        vaultId: "vault-2",
        vaultName: "Medical Receivables Brazil Q1 2026",
        stage: "Funding",
        depositedSol: 25000,
        expectedApyPct: 12.0,
        fundingEndAt: "2026-01-31T23:59:59Z",
        maturityAt: "2026-07-31T00:00:00Z",
        originatorShort: "MedReceivables Brazil",
        collateralShort: "Collateral",
        minInvestmentSOL: 100,
      },
      {
        vaultId: "vault-3",
        vaultName: "Medical Receivables Brazil Q3 2025",
        stage: "Matured",
        depositedSol: 75000,
        expectedApyPct: 12.0,
        fundingEndAt: "2025-08-31T23:59:59Z",
        maturityAt: "2026-02-28T00:00:00Z",
        realizedYieldSol: 4500, // actual yield earned
        realizedTotalSol: 79500,
        canClaim: true,
        originatorShort: "MedReceivables Brazil",
        collateralShort: "Collateral",
        minInvestmentSOL: 100,
      },
    ];

    const mockActivity: PortfolioActivity[] = [
      {
        type: "Deposit",
        amountSol: 50000,
        stage: "Funding",
        date: "2025-10-05T10:00:00Z",
        txSig: "5xA5B5C5D5E5F5G5H5I5J5K5L5M5N5O5P5Q5R5S5T5U",
        status: "success",
        vaultId: "vault-1",
        vaultName: "Medical Receivables Brazil Q4 2025",
      },
      {
        type: "Deposit",
        amountSol: 25000,
        stage: "Funding",
        date: "2025-10-15T14:30:00Z",
        txSig: "6xB6C6D6E6F6G6H6I6J6K6L6M6N6O6P6Q6R6S6T6U6V",
        status: "success",
        vaultId: "vault-2",
        vaultName: "Medical Receivables Brazil Q1 2026",
      },
    ];

    return { positions: mockPositions, activity: mockActivity };
  }, [connected, publicKey]);

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
