
// Vault statuses (matching backend exactly)
export const VAULT_STATUSES = ['Funding', 'Active', 'Matured', 'Canceled', 'Closed'] as const;
export type VaultStatus = typeof VAULT_STATUSES[number];

export interface VaultFundingInfo {
  status: VaultStatus;
  name: string;                     // vault name/title (e.g., "Medical Receivables Brazil Q4 2025")
  expectedApyPct: number;           // e.g., 12.0
  capSol: number;
  minInvestmentSol: number;
  raisedSol: number;
  totalClaimedSol: number;          // Total amount claimed by users
  fundingEndAt: string;             // ISO
  maturityAt: string;               // ISO
  originator: string;               // short label only
  // Payout fields for matured vaults
  payoutNum: string | null;         // Payout numerator (u128 as string)
  payoutDen: string | null;         // Payout denominator (u128 as string)
  addresses: {
    programId: string;
    vaultPda: string;
    authority: string;              // Authority wallet address (not a PDA)
    tokenMint: string;
    vaultTokenAccount: string;
  };
}

// Event tag types for activity feed (SIMPLIFIED for funding model)
export type EventTag =
  | "Deposit"
  | "Claim"
  | "Withdraw"
  | "System";

// Vault event for activity feed (SIMPLIFIED - funding model only)
export interface VaultEvent {
  id: string;
  tag: EventTag;
  ts: string;
  wallet: string;
  amountSol: number;
  txUrl: string;
  note?: string;
}

export interface OriginatorInfo {
  id: string;
  name: string;
  country?: string;
  note?: string; // short operation note shown in Facts
  website?: string;
}

export interface VaultSummary {
  id: string;
  title: string;
  status: VaultStatus;
  raised: number;       // SOL
  cap: number;          // SOL
  targetApy: number;    // annualized, e.g., 0.12 for 12%
  maturityDate: string; // ISO
  originator: OriginatorInfo;
}

export type ReceivableStatus = 'Performing' | 'Matured' | 'Repaid' | 'Disputed';

export interface Receivable {
  id: string;                 // external/invoice id
  originator: string;         // name
  payer: string;
  currency: 'SOL' | 'USD' | 'BRL';
  faceValue: number;          // notional in SOL-equivalent
  costBasis: number;          // purchase price
  advancePct: number;         // 0..1
  expectedRepayment: number;  // SOL-equivalent
  issueDate?: string;         // ISO
  maturityDate: string;       // ISO
  daysToMaturity?: number;    // derived
  daysPastDue?: number;       // derived if overdue
  status: ReceivableStatus;
  links?: {
    invoiceUrl?: string;
    assignmentUrl?: string;
    txUrl?: string;
  };
  notes?: string;
  attachments?: Array<{ name: string; url: string }>;
}

export interface CollateralAnalytics {
  receivableCount: number;
  faceValueTotal: number;
  costBasisTotal: number;
  outstandingTotal: number;
  weightedAvgLifeDays: number;
  topOriginatorPct?: number;
  topPayerPct?: number;
}

export interface HedgePosition {
  coveragePct: number;         // 0..1
  instrument: 'NDF' | 'Forward' | 'Swap' | 'Options' | 'Other';
  pair: string;                // e.g., USD/BRL
  notional: number;            // in quote terms (SOL-eq if needed)
  tenorStart: string;          // ISO
  tenorEnd: string;            // ISO
  referenceRate?: string;      // e.g., PTAX, SOFR
  mtm?: number;                // SOL
  realizedPnL?: number;        // SOL
  counterparty?: string;
  venue?: string;
  basisNote?: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'json' | 'link';
  url: string;
  uploadedAt?: string;
}

export interface VaultDocuments {
  files: VaultDocument[];
}

export interface VaultTransparencyData {
  summary: VaultSummary;
  collateral: {
    analytics: CollateralAnalytics;
    items: Receivable[];
  };
  hedge?: HedgePosition;
  documents: VaultDocuments;
  lastUpdated?: string;
}

export interface ReceivableFilters {
  status?: ReceivableStatus[];
  originator?: string[];
  payer?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
}

