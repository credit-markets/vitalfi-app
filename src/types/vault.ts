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
// LEGACY TYPES - Kept for backward compatibility with other pages
// TODO: Remove once portfolio and transparency pages are updated
// ============================================================================

// Core Lot type
export interface Lot {
  id: string;
  amount: number;
  unlockAt: string;
  status: "locked" | "unlocked";
}

// Pending withdrawal request
export interface PendingWithdrawal {
  id: string;
  amount: number;
  createdAt: string;
  claimAt: string;
  estSolOut: number;
  txUrl?: string;
}

// User state with wallet info (LEGACY)
export interface UserState {
  wallet: string | null;
  sol: number;
  shareLots: Lot[];
  pendingWithdrawals: PendingWithdrawal[];
}

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

// Legacy event tag types (for transparency page)
export type LegacyEventTag = EventTag | "WithdrawRequest" | "Repayment";

// Legacy vault event (for transparency page)
export interface LegacyVaultEvent {
  id: string;
  tag: LegacyEventTag;
  ts: string;
  wallet: string;
  amountSol?: number;
  shares?: number;
  txUrl: string;
  note?: string;
}

// Legacy types for compatibility
export interface VaultState {
  tvl: number;
  cap: number;
  capRemaining: number;
  paused: boolean;
  principalRedemptionValue: number;
  yieldAPR: number;
  currentAPY: number;
  liquidityBuffer: number;
  lastRepaymentAt: Date;
  queueDepth: number;
  nextRepaymentETA?: Date;
}

export interface ShareLot {
  id: string;
  amount: number;
  unlockAt: Date;
  status: "locked" | "unlocked";
  depositedAt: Date;
}

export interface UserVaultData {
  shareBalance: number;
  lots: ShareLot[];
  pendingWithdrawals: PendingWithdrawal[];
  totalLocked: number;
  totalUnlocked: number;
  nextUnlockDate?: Date;
}


export interface DepositPreview {
  solAmount: number;
  sharesMinted: number;
  unlockDate: Date;
  impliedAPY: number;
  fee: number;
}

export interface WithdrawPreview {
  sharesAmount: number;
  estSOL: number;
  availableAt: Date;
  queuePosition?: number;
}

// Portfolio types
export type PortfolioEventTag = "Deposit" | "WithdrawRequest" | "Claim";

export interface PortfolioEvent {
  id: string;
  tag: PortfolioEventTag;
  ts: string;
  amountSol?: number;
  shares?: number;
  txUrl: string;
  status?: "pending" | "success";
}

export interface PortfolioSummary {
  wallet: string;
  sharesTotal: number;
  sharesUnlocked: number;
  sharesLocked: number;
  currentValueSol: number;
  currentValueUsd: number;
  costBasisSol: number;
  unrealizedSol: number;
  realizedSol: number;
  nextUnlock?: { date: string; shares: number };
  allUnlocks?: Array<{ date: string; shares: number }>;
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

