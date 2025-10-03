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

export interface VPTLot {
  id: string;
  amount: number;
  unlockAt: Date;
  status: "locked" | "unlocked";
  depositedAt: Date;
}

export interface PendingWithdrawal {
  id: string;
  createdAt: Date;
  claimAt: Date;
  amount: number;
  estSOL: number;
  status: "pending" | "claimable";
}

export interface UserVaultData {
  vPTBalance: number;
  vYTBalance: number;
  lots: VPTLot[];
  pendingWithdrawals: PendingWithdrawal[];
  totalLocked: number;
  totalUnlocked: number;
  nextUnlockDate?: Date;
}

export type ActivityType =
  | "deposit"
  | "withdraw_request"
  | "claim"
  | "yield_sell"
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
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
}

export interface VaultChartData {
  tvl: ChartDataPoint[];
  vPTValue: ChartDataPoint[];
  yieldAPY: ChartDataPoint[];
}

export interface DepositPreview {
  solAmount: number;
  vPTMinted: number;
  vYTMinted: number;
  unlockDate: Date;
  impliedAPY: number;
  fee: number;
}

export interface WithdrawPreview {
  vPTAmount: number;
  estSOL: number;
  availableAt: Date;
  queuePosition?: number;
}

export interface YieldSellPreview {
  vYTAmount: number;
  solOut: number;
  pricePerVYT: number;
  slippage: number;
}
