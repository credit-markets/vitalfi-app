"use client";

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VaultEvent, VaultFundingInfo } from '@/types/vault';
import { getMockFundingVaultInfo } from '@/lib/transparency/mock';

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
 * In production, this would fetch from:
 * - On-chain vault account data
 * - Event indexer/API for transaction history
 *
 * Returns null for info/computed when vault is not found or on error.
 * Components should check the error field first, then info/computed nullability.
 */
export function useFundingVault(): UseFundingVaultReturn {
  const params = useParams();
  const vaultId = params.vaultId as string;
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<VaultFundingInfo | null>(null);

  // Load vault info
  useEffect(() => {
    let cancelled = false;

    if (!vaultId) {
      setError('Vault ID is required');
      return;
    }

    try {
      const vaultInfo = getMockFundingVaultInfo(vaultId);
      if (!cancelled) {
        setInfo(vaultInfo);
        setError(null);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load vault data');
        setInfo(null);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [vaultId]);

  // Mock events - TODO: fetch from indexer/API
  const events: VaultEvent[] = useMemo(() => {
    const baseUrl = "https://explorer.solana.com/tx";
    const cluster = "devnet";

    return [
      {
        id: "evt-5",
        tag: "Deposit",
        ts: new Date("2025-10-15T10:30:00Z").toISOString(),
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        amountSol: 50000,
        txUrl: `${baseUrl}/5A5B5C5D5E5F5G5H5I5J5K5L5M5N5O5P5Q5R5S5T5U?cluster=${cluster}`,
        note: "Funding deposit",
      },
      {
        id: "evt-4",
        tag: "Deposit",
        ts: new Date("2025-10-12T14:20:00Z").toISOString(),
        wallet: "9zMCte5nDpN8PxJ2LqWfXG3mYtSKVAhh4YmDUXs9Pmq",
        amountSol: 75000,
        txUrl: `${baseUrl}/4A4B4C4D4E4F4G4H4I4J4K4L4M4N4O4P4Q4R4S4T4U?cluster=${cluster}`,
        note: "Funding deposit",
      },
      {
        id: "evt-3",
        tag: "Deposit",
        ts: new Date("2025-10-08T09:15:00Z").toISOString(),
        wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
        amountSol: 125000,
        txUrl: `${baseUrl}/3A3B3C3D3E3F3G3H3I3J3K3L3M3N3O3P3Q3R3S3T3U?cluster=${cluster}`,
        note: "Funding deposit",
      },
      {
        id: "evt-2",
        tag: "Deposit",
        ts: new Date("2025-10-05T16:45:00Z").toISOString(),
        wallet: "2vLpF8rGYK5HwD9x8jTnCpUaEbXmJvAqZsWtDe4BhNm",
        amountSol: 200000,
        txUrl: `${baseUrl}/2A2B2C2D2E2F2G2H2I2J2K2L2M2N2O2P2Q2R2S2T2U?cluster=${cluster}`,
        note: "Funding deposit",
      },
      {
        id: "evt-1",
        tag: "Deposit",
        ts: new Date("2025-10-01T10:00:00Z").toISOString(),
        wallet: "AdminWallet111111111111111111111111111111111",
        amountSol: 250000,
        txUrl: `${baseUrl}/1A1B1C1D1E1F1G1H1I1J1K1L1M1N1O1P1Q1R1S1T1U?cluster=${cluster}`,
        note: "Initial subordination deposit",
      },
    ];
  }, []);

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
