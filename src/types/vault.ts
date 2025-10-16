// ============================================================================
// FUNDING VAULT MODEL - Fixed-Yield Crowdfunding
// ============================================================================

export type VaultStage = 'Funding' | 'Funded' | 'Matured' | 'Closed';

export interface VaultFundingInfo {
  stage: VaultStage;
  expectedApyPct: number;           // e.g., 12.0
  tvlSol: number;                   // equals raisedSol for clarity
  capSol: number;
  minInvestmentSol: number;
  raisedSol: number;
  subordinationSol?: number;        // optional
  fundingStartAt: string;           // ISO
  fundingEndAt: string;             // ISO
  maturityAt: string;               // ISO
  originator: string;               // short label only
  guarantees: 'Collateral';
  addresses: {
    programId: string;
    vaultPda: string;
    authorityPda: string;
    tokenMint: string;
    vaultTokenAccount: string;
  };
}

// ============================================================================
// VAULT EVENT TYPES - Used by active vault page components
// ============================================================================

// Event tag types for activity feed (SIMPLIFIED for funding model)
export type EventTag =
  | "Deposit"
  | "Claim"
  | "Params";

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


// ============================================================================
// NEW TRANSPARENCY TYPES - Receivables-based model (Funded/Matured only)
// ============================================================================

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
  stage: VaultStage;
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

