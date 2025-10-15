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

// Complete vault statistics (LEGACY - for transparency/portfolio pages)
export interface VaultStats {
  tvl: number;
  supply: number;
  pricePerShare: number;
  apy: number;
  cap: number;
  capRemaining: number;
  paused: boolean;
  principalRedemption: number; // e.g., 1.02x
  yieldAPR: number; // e.g., 8.5
  liquidityBuffer: number;
  lastRepaymentAt: string;
  nextRepaymentEta?: string;
  queueDepth: number;
  avgClaimTimeDays: number;
  shareHistory: Array<{
    t: string;
    tvl: number;
    shareValue: number;
    apy: number;
  }>;
  addresses: {
    programId: string;
    vaultPda: string;
    authorityPda: string;
    tokenMint: string;
    vaultTokenAccount: string;
  };
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


export type ActivityType =
  | "deposit"
  | "withdraw_request"
  | "claim"
  | "repayment"
  | "params";

export interface Activity {
  id: string;
  type: ActivityType;
  amount: number;
  wallet: string;
  timestamp: Date;
  txSignature: string;
  status?: "success" | "failed" | "pending";
  solAmount?: number;
  user?: string;
  signature?: string;
  paramName?: string;
  newValue?: string;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
}

export interface VaultChartData {
  tvl: ChartDataPoint[];
  shareValue: ChartDataPoint[];
  yieldAPY: ChartDataPoint[];
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
  ppsAt?: number;
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

export interface PpsPoint {
  t: string;
  pps: number;
}

// Transparency types
export type CollateralKind = "Receivable" | "Invoice" | "CashBuffer" | "Reserve" | "Other";
export type CollateralStatus = "performing" | "matured" | "repaid" | "in-default" | "buffer";

export interface CollateralItem {
  id: string;
  label: string;
  kind: CollateralKind;
  notionalSol: number;
  status: CollateralStatus;
  maturityAt?: string;
  lastPaymentAt?: string;
  ltv?: number;
  tags?: string[];
}

export interface CollateralSnapshot {
  deployedSol: number;
  liquidityBufferSol: number;
  capRemainingSol: number;
  totalNotionalSol: number;
  performingPct: number;
  avgMaturityDays?: number;
  items: CollateralItem[];
}

export interface ParamChange {
  id: string;
  key: string;
  oldValue: string | number;
  newValue: string | number;
  ts: string;
  txUrl: string;
}

export interface DerivedMetrics {
  ppsSeries: Array<{ t: string; pps: number }>;
  apr7d: Array<{ t: string; apr: number }>;
  apr30d: Array<{ t: string; apr: number }>;
  assetsNow: number;
  supplyNow: number;
  ppsNow: number;
}

export interface ReconciliationData {
  assetsOnChain: number;
  supply: number;
  pps: number;
  tvl: number;
  delta: number;
}
