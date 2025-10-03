import type {
  VaultState,
  UserVaultData,
  Activity,
  VaultChartData,
  DepositPreview,
  WithdrawPreview,
  YieldSellPreview,
  VPTLot,
} from "@/types/vault";

// Fixed base date to avoid hydration errors
const BASE_DATE = new Date("2025-10-01T00:00:00Z");

// Mock Vault Global State
export const getMockVaultState = (): VaultState => {
  return {
    tvl: 2_400_000,
    cap: 5_000_000,
    capRemaining: 2_600_000,
    paused: false,
    principalRedemptionValue: 1.02,
    yieldAPR: 8.5,
    currentAPY: 8.5,
    liquidityBuffer: 150_000,
    lastRepaymentAt: new Date("2025-09-29T00:00:00Z"), // 2 days before base
    queueDepth: 3,
    nextRepaymentETA: new Date("2025-10-06T00:00:00Z"), // 5 days after base
  };
};

// Mock User Data
export const getMockUserData = (hasDeposits: boolean = true): UserVaultData => {
  if (!hasDeposits) {
    return {
      vPTBalance: 0,
      vYTBalance: 0,
      lots: [],
      pendingWithdrawals: [],
      totalLocked: 0,
      totalUnlocked: 0,
    };
  }

  const lots: VPTLot[] = [
    {
      id: "lot-1",
      amount: 50,
      unlockAt: new Date("2025-10-31T00:00:00Z"), // 30 days from base
      status: "locked",
      depositedAt: new Date("2025-08-02T00:00:00Z"),
    },
    {
      id: "lot-2",
      amount: 25,
      unlockAt: new Date("2025-09-26T00:00:00Z"), // already unlocked
      status: "unlocked",
      depositedAt: new Date("2025-06-28T00:00:00Z"),
    },
    {
      id: "lot-3",
      amount: 75,
      unlockAt: new Date("2025-11-30T00:00:00Z"), // 60 days from base
      status: "locked",
      depositedAt: new Date("2025-09-01T00:00:00Z"),
    },
  ];

  return {
    vPTBalance: 150,
    vYTBalance: 12.5,
    lots,
    pendingWithdrawals: [
      {
        id: "pending-1",
        createdAt: new Date("2025-09-30T00:00:00Z"),
        claimAt: new Date("2025-10-02T00:00:00Z"),
        amount: 10,
        estSOL: 10.2,
        status: "pending",
      },
    ],
    totalLocked: 125,
    totalUnlocked: 25,
    nextUnlockDate: new Date("2025-10-31T00:00:00Z"),
  };
};

// Mock Activity Feed
export const getMockActivity = (): Activity[] => {
  return [
    {
      id: "activity-1",
      type: "deposit",
      solAmount: 75,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-09-01T00:00:00Z"),
      signature: "5J8Y9K3mNpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWxYz123456789ABC",
      status: "success",
    },
    {
      id: "activity-2",
      type: "deposit",
      solAmount: 50,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-08-02T00:00:00Z"),
      signature: "4G7H8I9jKlMnOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQr123456789DEF",
      status: "success",
    },
    {
      id: "activity-3",
      type: "repayment",
      solAmount: 15000,
      user: "VaultProgram111111111111111111111111111111111",
      timestamp: new Date("2025-09-29T00:00:00Z"),
      signature: "8K9L0M1nOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUv123456789GHI",
      status: "success",
    },
    {
      id: "activity-4",
      type: "withdraw_request",
      vPTAmount: 10,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-09-30T00:00:00Z"),
      signature: "2L5M6N7oPqRsTuVwXyZ1A2bCdEfGhIjKlMnOpQrStUvW123456789JKL",
      status: "pending",
    },
    {
      id: "activity-5",
      type: "deposit",
      solAmount: 25,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-06-28T00:00:00Z"),
      signature: "9M3N4O5pQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWx123456789MNO",
      status: "success",
    },
  ];
};

// Mock Chart Data - fixed values to avoid hydration
export const getMockChartData = (days: 7 | 30 = 7): VaultChartData => {
  const points: VaultChartData = { tvl: [], vPTValue: [], yieldAPY: [] };

  const tvlValues7d = [2200000, 2250000, 2300000, 2280000, 2350000, 2380000, 2400000];
  const vptValues7d = [1.00, 1.005, 1.01, 1.012, 1.015, 1.018, 1.02];
  const yieldValues7d = [8.2, 8.3, 8.4, 8.5, 8.5, 8.6, 8.5];

  if (days === 7) {
    for (let i = 0; i < 7; i++) {
      const timestamp = new Date(`2025-09-${25 + i}T00:00:00Z`);
      points.tvl.push({ timestamp, value: tvlValues7d[i] });
      points.vPTValue.push({ timestamp, value: vptValues7d[i] });
      points.yieldAPY.push({ timestamp, value: yieldValues7d[i] });
    }
  }

  return points;
};

// Calculation Functions
export const calculateDepositPreview = (solAmount: number): DepositPreview => {
  const vaultState = getMockVaultState();
  const vPTMinted = solAmount;
  const vYTMinted = (solAmount * vaultState.yieldAPR) / 100;

  return {
    solAmount,
    vPTMinted,
    vYTMinted,
    unlockDate: new Date("2025-12-30T00:00:00Z"), // 90 days from base
    impliedAPY: vaultState.yieldAPR,
    fee: 0,
  };
};

export const calculateWithdrawPreview = (vPTAmount: number): WithdrawPreview => {
  const vaultState = getMockVaultState();
  const estSOL = vPTAmount * vaultState.principalRedemptionValue;

  return {
    vPTAmount,
    estSOL,
    availableAt: new Date("2025-10-03T00:00:00Z"), // 2 days from base
    queuePosition: vaultState.queueDepth + 1,
  };
};

export const calculateYieldSellPreview = (vYTAmount: number): YieldSellPreview => {
  const pricePerVYT = 0.95; // Mock pricing
  const solOut = vYTAmount * pricePerVYT;
  const slippage = 0.5; // 0.5%

  return {
    vYTAmount,
    solOut,
    pricePerVYT,
    slippage,
  };
};
