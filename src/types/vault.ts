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

// Complete vault statistics
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

// User state with wallet info
export interface UserState {
  wallet: string | null;
  sol: number;
  shareLots: Lot[];
  pendingWithdrawals: PendingWithdrawal[];
}

// Event tag types for activity feed
export type EventTag =
  | "Deposit"
  | "WithdrawRequest"
  | "Claim"
  | "Repayment"
  | "Params";

// Vault event for activity feed
export interface VaultEvent {
  id: string;
  tag: EventTag;
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
