import type {
  VaultState,
  UserVaultData,
  Activity,
  VaultChartData,
  DepositPreview,
  WithdrawPreview,
  ShareLot,
  VaultStats,
  LegacyVaultEvent,
  CollateralSnapshot,
  CollateralItem,
  ParamChange,
} from "@/types/vault";

// Mock Vault Contract Addresses
export const MOCK_ADDRESSES = {
  programId: "VFi1111111111111111111111111111111111111111",
  vaultPda: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  authorityPda: "8xPZfG715bTx8DNjGmaS23yuVM1YWaqqqZa8OtrUein",
  tokenMint: "vTOK111111111111111111111111111111111111111",
  vaultTokenAccount: "So11111111111111111111111111111111111111112",
};

// Enhanced Vault Stats with new fields
export const getMockVaultStats = (): VaultStats => {
  const now = Date.now();
  const lastRepayment = new Date("2025-09-29T00:00:00Z");
  const nextRepayment = new Date("2025-10-06T00:00:00Z");

  // Simulate periodic repayments that increase share redemption value
  const daysSinceLastRepayment = Math.floor((now - lastRepayment.getTime()) / (1000 * 60 * 60 * 24));
  const repaymentCycles = Math.floor(daysSinceLastRepayment / 7); // Weekly repayments
  const baseRedemption = 1.00;
  const redemptionGrowth = 0.02 + (repaymentCycles * 0.005);
  const principalRedemption = Number((baseRedemption + redemptionGrowth).toFixed(3));

  const baseYieldAPR = 8.0;
  const yieldGrowth = 0.5 + (repaymentCycles * 0.1);
  const yieldAPR = Number((baseYieldAPR + yieldGrowth).toFixed(2));

  // Generate share history (last 30 days)
  const shareHistory: VaultStats["shareHistory"] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    shareHistory.push({
      t: date.toISOString(),
      tvl: 2_000_000 + i * 13_000 + Math.random() * 50_000,
      shareValue: 1.00 + (30 - i) * 0.0007,
      apy: 8.0 + Math.random() * 0.5,
    });
  }

  const tvl = 2_400_000;
  const supply = 2_350_000;
  const pricePerShare = tvl / supply;
  const apy = 8.5;

  return {
    tvl,
    supply,
    pricePerShare,
    apy,
    cap: 5_000_000,
    capRemaining: 2_600_000,
    paused: false,
    principalRedemption,
    yieldAPR,
    liquidityBuffer: 150_000,
    lastRepaymentAt: lastRepayment.toISOString(),
    nextRepaymentEta: nextRepayment.toISOString(),
    queueDepth: 3,
    avgClaimTimeDays: 2,
    shareHistory,
    addresses: MOCK_ADDRESSES,
  };
};

// Mock Vault Global State (legacy compatibility)
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
      shareBalance: 0,
      lots: [],
      pendingWithdrawals: [],
      totalLocked: 0,
      totalUnlocked: 0,
    };
  }

  const lots: ShareLot[] = [
    {
      id: "lot-1",
      amount: 50,
      unlockAt: new Date("2025-10-31T00:00:00Z"),
      status: "locked",
      depositedAt: new Date("2025-08-02T00:00:00Z"),
    },
    {
      id: "lot-2",
      amount: 25,
      unlockAt: new Date("2025-09-26T00:00:00Z"),
      status: "unlocked",
      depositedAt: new Date("2025-06-28T00:00:00Z"),
    },
    {
      id: "lot-3",
      amount: 75,
      unlockAt: new Date("2025-11-30T00:00:00Z"),
      status: "locked",
      depositedAt: new Date("2025-09-01T00:00:00Z"),
    },
  ];

  return {
    shareBalance: 150,
    lots,
    pendingWithdrawals: [
      {
        id: "pending-1",
        createdAt: "2025-09-30T00:00:00Z",
        claimAt: "2025-10-02T00:00:00Z",
        amount: 10,
        estSolOut: 10.2,
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
      amount: 75,
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-09-01T00:00:00Z"),
      txSignature: "5J8Y9K3mNpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWxYz123456789ABC",
      status: "success",
      solAmount: 75,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "5J8Y9K3mNpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWxYz123456789ABC",
    },
    {
      id: "activity-2",
      type: "deposit",
      amount: 50,
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-08-02T00:00:00Z"),
      txSignature: "4G7H8I9jKlMnOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQr123456789DEF",
      status: "success",
      solAmount: 50,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "4G7H8I9jKlMnOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQr123456789DEF",
    },
    {
      id: "activity-3",
      type: "repayment",
      amount: 15000,
      wallet: "VaultProgram111111111111111111111111111111111",
      timestamp: new Date("2025-09-29T00:00:00Z"),
      txSignature: "8K9L0M1nOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUv123456789GHI",
      status: "success",
      solAmount: 15000,
      user: "VaultProgram111111111111111111111111111111111",
      signature: "8K9L0M1nOpQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUv123456789GHI",
    },
    {
      id: "activity-4",
      type: "withdraw_request",
      amount: 10,
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-09-30T00:00:00Z"),
      txSignature: "2L5M6N7oPqRsTuVwXyZ1A2bCdEfGhIjKlMnOpQrStUvW123456789JKL",
      status: "pending",
      solAmount: 10,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "2L5M6N7oPqRsTuVwXyZ1A2bCdEfGhIjKlMnOpQrStUvW123456789JKL",
    },
    {
      id: "activity-5",
      type: "deposit",
      amount: 25,
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      timestamp: new Date("2025-06-28T00:00:00Z"),
      txSignature: "9M3N4O5pQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWx123456789MNO",
      status: "success",
      solAmount: 25,
      user: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      signature: "9M3N4O5pQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWx123456789MNO",
    },
  ];
};

// Mock Chart Data - fixed values to avoid hydration
export const getMockChartData = (days: 7 | 30 = 7): VaultChartData => {
  const points: VaultChartData = { tvl: [], shareValue: [], yieldAPY: [] };

  const tvlValues7d = [2200000, 2250000, 2300000, 2280000, 2350000, 2380000, 2400000];
  const shareValues7d = [1.00, 1.005, 1.01, 1.012, 1.015, 1.018, 1.02];
  const yieldValues7d = [8.2, 8.3, 8.4, 8.5, 8.5, 8.6, 8.5];

  if (days === 7) {
    for (let i = 0; i < 7; i++) {
      const timestamp = new Date(`2025-09-${25 + i}T00:00:00Z`);
      points.tvl.push({ timestamp, value: tvlValues7d[i] });
      points.shareValue.push({ timestamp, value: shareValues7d[i] });
      points.yieldAPY.push({ timestamp, value: yieldValues7d[i] });
    }
  }

  return points;
};

// Calculation Functions
export const calculateDepositPreview = (solAmount: number): DepositPreview => {
  const vaultState = getMockVaultState();
  const sharesMinted = solAmount;

  return {
    solAmount,
    sharesMinted,
    unlockDate: new Date("2025-12-30T00:00:00Z"),
    impliedAPY: vaultState.yieldAPR,
    fee: 0,
  };
};

export const calculateWithdrawPreview = (sharesAmount: number): WithdrawPreview => {
  const vaultState = getMockVaultState();
  const estSOL = sharesAmount * vaultState.principalRedemptionValue;

  return {
    sharesAmount,
    estSOL,
    availableAt: new Date("2025-10-03T00:00:00Z"),
    queuePosition: vaultState.queueDepth + 1,
  };
};

// Extended vault events for transparency page
export const getMockVaultEvents = (): LegacyVaultEvent[] => {
  const baseUrl = "https://explorer.solana.com/tx";
  const cluster = "devnet";

  // Generate comprehensive event history (30+ events over 90 days)
  return [
    // Initial deposits
    {
      id: "evt-1",
      tag: "Deposit",
      ts: new Date("2025-07-01T10:00:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 1000000,
      shares: 1000000,
      txUrl: `${baseUrl}/1A1B1C1D1E1F1G1H1I1J1K1L1M1N1O1P1Q1R1S1T1U?cluster=${cluster}`,
      note: "Initial vault seed deposit",
    },
    {
      id: "evt-2",
      tag: "Deposit",
      ts: new Date("2025-07-03T14:30:00Z").toISOString(),
      wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
      amountSol: 50000,
      shares: 50000,
      txUrl: `${baseUrl}/2A2B2C2D2E2F2G2H2I2J2K2L2M2N2O2P2Q2R2S2T2U?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-3",
      tag: "Deposit",
      ts: new Date("2025-07-05T09:15:00Z").toISOString(),
      wallet: "9zMCte5nDpN8PxJ2LqWfXG3mYtSKVAhh4YmDUXs9Pmq",
      amountSol: 75000,
      shares: 75000,
      txUrl: `${baseUrl}/3A3B3C3D3E3F3G3H3I3J3K3L3M3N3O3P3Q3R3S3T3U?cluster=${cluster}`,
      note: "User deposit",
    },
    // First repayment
    {
      id: "evt-4",
      tag: "Repayment",
      ts: new Date("2025-07-08T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 25000,
      txUrl: `${baseUrl}/4A4B4C4D4E4F4G4H4I4J4K4L4M4N4O4P4Q4R4S4T4U?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-5",
      tag: "Deposit",
      ts: new Date("2025-07-10T11:20:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 100000,
      shares: 100000,
      txUrl: `${baseUrl}/5A5B5C5D5E5F5G5H5I5J5K5L5M5N5O5P5Q5R5S5T5U?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-6",
      tag: "Repayment",
      ts: new Date("2025-07-15T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 28000,
      txUrl: `${baseUrl}/6A6B6C6D6E6F6G6H6I6J6K6L6M6N6O6P6Q6R6S6T6U?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-7",
      tag: "Deposit",
      ts: new Date("2025-07-18T16:45:00Z").toISOString(),
      wallet: "2vLpF8rGYK5HwD9x8jTnCpUaEbXmJvAqZsWtDe4BhNm",
      amountSol: 60000,
      shares: 60000,
      txUrl: `${baseUrl}/7A7B7C7D7E7F7G7H7I7J7K7L7M7N7O7P7Q7R7S7T7U?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-8",
      tag: "Repayment",
      ts: new Date("2025-07-22T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 30000,
      txUrl: `${baseUrl}/8A8B8C8D8E8F8G8H8I8J8K8L8M8N8O8P8Q8R8S8T8U?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-9",
      tag: "Deposit",
      ts: new Date("2025-07-25T13:30:00Z").toISOString(),
      wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
      amountSol: 40000,
      shares: 40000,
      txUrl: `${baseUrl}/9A9B9C9D9E9F9G9H9I9J9K9L9M9N9O9P9Q9R9S9T9U?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-10",
      tag: "Repayment",
      ts: new Date("2025-07-29T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 32000,
      txUrl: `${baseUrl}/A1A2A3A4A5A6A7A8A9AABACADAEAFAGAHAIAJAKALAMANA?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    // August
    {
      id: "evt-11",
      tag: "Deposit",
      ts: new Date("2025-08-02T14:20:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 50000,
      shares: 50000,
      txUrl: `${baseUrl}/B1B2B3B4B5B6B7B8B9BBBCBDBEBFBGBHBIBJBKBLBMBNB?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-12",
      tag: "Repayment",
      ts: new Date("2025-08-05T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 35000,
      txUrl: `${baseUrl}/C1C2C3C4C5C6C7C8C9CCCCCECDCECFCGCHCICJCKCLCMCNC?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-13",
      tag: "Deposit",
      ts: new Date("2025-08-08T10:10:00Z").toISOString(),
      wallet: "9zMCte5nDpN8PxJ2LqWfXG3mYtSKVAhh4YmDUXs9Pmq",
      amountSol: 85000,
      shares: 85000,
      txUrl: `${baseUrl}/D1D2D3D4D5D6D7D8D9DDDCDDDEDFDGDHDIDJDKDLDMDND?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-14",
      tag: "WithdrawRequest",
      ts: new Date("2025-08-10T09:00:00Z").toISOString(),
      wallet: "2vLpF8rGYK5HwD9x8jTnCpUaEbXmJvAqZsWtDe4BhNm",
      shares: 30000,
      txUrl: `${baseUrl}/E1E2E3E4E5E6E7E8E9EEECEDEEEFEGEHEIEJEKELEMENE?cluster=${cluster}`,
      note: "Withdrawal requested",
    },
    {
      id: "evt-15",
      tag: "Repayment",
      ts: new Date("2025-08-12T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 38000,
      txUrl: `${baseUrl}/F1F2F3F4F5F6F7F8F9FFFCFDFEFFFGFHFIFJFKFLFMFNF?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-16",
      tag: "Claim",
      ts: new Date("2025-08-12T12:00:00Z").toISOString(),
      wallet: "2vLpF8rGYK5HwD9x8jTnCpUaEbXmJvAqZsWtDe4BhNm",
      amountSol: 30600,
      shares: -30000,
      txUrl: `${baseUrl}/G1G2G3G4G5G6G7G8G9GGGCGDGEGFGGGHGIGJGKGLGMGNG?cluster=${cluster}`,
      note: "Withdrawal claimed",
    },
    {
      id: "evt-17",
      tag: "Deposit",
      ts: new Date("2025-08-15T15:30:00Z").toISOString(),
      wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
      amountSol: 120000,
      shares: 120000,
      txUrl: `${baseUrl}/H1H2H3H4H5H6H7H8H9HHHCHDHEHFHGHHHI HJHKHLHMHNH?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-18",
      tag: "Repayment",
      ts: new Date("2025-08-19T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 40000,
      txUrl: `${baseUrl}/I1I2I3I4I5I6I7I8I9IIIICIDIEIFIGIIHIIJIKILIMINÍ?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-19",
      tag: "Deposit",
      ts: new Date("2025-08-22T11:45:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 95000,
      shares: 95000,
      txUrl: `${baseUrl}/J1J2J3J4J5J6J7J8J9JJJCJDJEJFJGJHJIJJJKJLJMJNJ?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-20",
      tag: "Repayment",
      ts: new Date("2025-08-26T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 42000,
      txUrl: `${baseUrl}/K1K2K3K4K5K6K7K8K9KKKCKDKEKFKGKHKIKJKKKLKMKNK?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    // September
    {
      id: "evt-21",
      tag: "Deposit",
      ts: new Date("2025-09-01T10:30:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 75000,
      shares: 75000,
      txUrl: `${baseUrl}/L1L2L3L4L5L6L7L8L9LLLCLDLELFLGLHLILJLKLLMLNL?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-22",
      tag: "Repayment",
      ts: new Date("2025-09-02T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 45000,
      txUrl: `${baseUrl}/M1M2M3M4M5M6M7M8M9MMMCMDMEMFMGMHMIMJMKMLMMNM?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-23",
      tag: "Deposit",
      ts: new Date("2025-09-05T14:00:00Z").toISOString(),
      wallet: "9zMCte5nDpN8PxJ2LqWfXG3mYtSKVAhh4YmDUXs9Pmq",
      amountSol: 110000,
      shares: 110000,
      txUrl: `${baseUrl}/N1N2N3N4N5N6N7N8N9NNNNDNENFNGNHNINNJNKNLNMNN?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-24",
      tag: "Repayment",
      ts: new Date("2025-09-09T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 48000,
      txUrl: `${baseUrl}/O1O2O3O4O5O6O7O8O9OOOCODOEOFOGOHIOOJOKOLOMONO?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-25",
      tag: "WithdrawRequest",
      ts: new Date("2025-09-12T08:30:00Z").toISOString(),
      wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
      shares: 50000,
      txUrl: `${baseUrl}/P1P2P3P4P5P6P7P8P9PPPPCPDPEPFPGPHPIPJPKPLPMPNP?cluster=${cluster}`,
      note: "Withdrawal requested",
    },
    {
      id: "evt-26",
      tag: "Claim",
      ts: new Date("2025-09-14T12:00:00Z").toISOString(),
      wallet: "4yKMtg1ED76bVw5BPoFaR23wtTL1XVyppYa6MsqTemk",
      amountSol: 51000,
      shares: -50000,
      txUrl: `${baseUrl}/Q1Q2Q3Q4Q5Q6Q7Q8Q9QQQCQDQEQFQGQHQIQJQKQLQMQNQ?cluster=${cluster}`,
      note: "Withdrawal claimed",
    },
    {
      id: "evt-27",
      tag: "Repayment",
      ts: new Date("2025-09-16T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 50000,
      txUrl: `${baseUrl}/R1R2R3R4R5R6R7R8R9RRRCRDRERFRGRHIRJRKRLRMRNR?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-28",
      tag: "Deposit",
      ts: new Date("2025-09-18T09:20:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      amountSol: 130000,
      shares: 130000,
      txUrl: `${baseUrl}/S1S2S3S4S5S6S7S8S9SSSCSDSESFSGSHS ISJSKSLS MSNR?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-29",
      tag: "Repayment",
      ts: new Date("2025-09-23T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 52000,
      txUrl: `${baseUrl}/T1T2T3T4T5T6T7T8T9TTTCTDTEFTGTHT1TJTKTLTMTNT?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-30",
      tag: "Deposit",
      ts: new Date("2025-09-25T16:00:00Z").toISOString(),
      wallet: "9zMCte5nDpN8PxJ2LqWfXG3mYtSKVAhh4YmDUXs9Pmq",
      amountSol: 80000,
      shares: 80000,
      txUrl: `${baseUrl}/U1U2U3U4U5U6U7U8U9UUUUCUDUEUFTUGUHUJUKLUUMNUU?cluster=${cluster}`,
      note: "User deposit",
    },
    {
      id: "evt-31",
      tag: "Repayment",
      ts: new Date("2025-09-29T00:00:00Z").toISOString(),
      wallet: "VaultProgram111111111111111111111111111111111",
      amountSol: 55000,
      txUrl: `${baseUrl}/V1V2V3V4V5V6V7V8V9VVVLCVDVEVFVGVHVIVJVKVLVMVNV?cluster=${cluster}`,
      note: "Weekly repayment",
    },
    {
      id: "evt-32",
      tag: "WithdrawRequest",
      ts: new Date("2025-09-30T09:15:00Z").toISOString(),
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      shares: 10000,
      txUrl: `${baseUrl}/W1W2W3W4W5W6W7W8W9WWWCWDWEWFWGWHWIWJWKWLWMWNW?cluster=${cluster}`,
      note: "Withdrawal requested",
    },
  ];
};

// Portfolio mock data
export const getMockPortfolioSummary = (wallet: string) => {
  const now = Date.now();
  const pricePerShare = 1.021;
  const solUsdPrice = 140; // Mock SOL price

  // User has 3 deposit lots with 90-day lock
  const lots = [
    { shares: 50, depositedAt: new Date("2025-08-02T00:00:00Z"), unlockAt: new Date("2025-10-31T00:00:00Z"), costBasis: 50 },
    { shares: 25, depositedAt: new Date("2025-06-28T00:00:00Z"), unlockAt: new Date("2025-09-26T00:00:00Z"), costBasis: 25 },
    { shares: 75, depositedAt: new Date("2025-09-01T00:00:00Z"), unlockAt: new Date("2025-11-30T00:00:00Z"), costBasis: 75 },
  ];

  const sharesTotal = lots.reduce((sum, lot) => sum + lot.shares, 0);
  const sharesUnlocked = lots.filter(lot => new Date(lot.unlockAt).getTime() <= now).reduce((sum, lot) => sum + lot.shares, 0);
  const sharesLocked = sharesTotal - sharesUnlocked;
  const costBasisSol = lots.reduce((sum, lot) => sum + lot.costBasis, 0);
  const currentValueSol = sharesTotal * pricePerShare;
  const currentValueUsd = currentValueSol * solUsdPrice;
  const realizedSol = 0; // No claims yet
  const unrealizedSol = currentValueSol - costBasisSol;

  const upcomingUnlocks = lots
    .filter(lot => new Date(lot.unlockAt).getTime() > now)
    .sort((a, b) => new Date(a.unlockAt).getTime() - new Date(b.unlockAt).getTime());

  return {
    wallet,
    sharesTotal,
    sharesUnlocked,
    sharesLocked,
    currentValueSol,
    currentValueUsd,
    costBasisSol,
    unrealizedSol,
    realizedSol,
    nextUnlock: upcomingUnlocks.length > 0 ? { date: upcomingUnlocks[0].unlockAt.toISOString(), shares: upcomingUnlocks[0].shares } : undefined,
    allUnlocks: upcomingUnlocks.map(u => ({ date: u.unlockAt.toISOString(), shares: u.shares })),
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getMockPortfolioEvents = (_wallet: string) => {
  const baseUrl = "https://explorer.solana.com/tx";
  const cluster = "devnet";

  return [
    {
      id: "portfolio-1",
      tag: "Deposit" as const,
      ts: new Date("2025-09-01T10:30:00Z").toISOString(),
      amountSol: 75,
      shares: 75,
      ppsAt: 1.00,
      txUrl: `${baseUrl}/L1L2L3L4L5L6L7L8L9LLLCLDLELFLGLHLILJLKLLMLNL?cluster=${cluster}`,
      status: "success" as const,
    },
    {
      id: "portfolio-2",
      tag: "Deposit" as const,
      ts: new Date("2025-08-02T14:20:00Z").toISOString(),
      amountSol: 50,
      shares: 50,
      ppsAt: 1.00,
      txUrl: `${baseUrl}/B1B2B3B4B5B6B7B8B9BBBCBDBEBFBGBHBIBJBKBLBMBNB?cluster=${cluster}`,
      status: "success" as const,
    },
    {
      id: "portfolio-3",
      tag: "Deposit" as const,
      ts: new Date("2025-06-28T09:15:00Z").toISOString(),
      amountSol: 25,
      shares: 25,
      ppsAt: 1.00,
      txUrl: `${baseUrl}/9M3N4O5pQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWx123456789MNO?cluster=${cluster}`,
      status: "success" as const,
    },
  ];
};

// Transparency mock data
export const getMockCollateralSnapshot = (): CollateralSnapshot => {
  const items: CollateralItem[] = [
    {
      id: "coll-1",
      label: "Clinic A – Batch #1029",
      kind: "Receivable",
      notionalSol: 450000,
      status: "performing",
      maturityAt: new Date("2025-11-15T00:00:00Z").toISOString(),
      lastPaymentAt: new Date("2025-09-29T00:00:00Z").toISOString(),
      ltv: 0.85,
      tags: ["Healthcare", "BR"],
    },
    {
      id: "coll-2",
      label: "Clinic B – Batch #1030",
      kind: "Invoice",
      notionalSol: 380000,
      status: "performing",
      maturityAt: new Date("2025-12-01T00:00:00Z").toISOString(),
      lastPaymentAt: new Date("2025-09-23T00:00:00Z").toISOString(),
      ltv: 0.82,
      tags: ["Healthcare", "BR"],
    },
    {
      id: "coll-3",
      label: "Clinic C – Batch #1027",
      kind: "Receivable",
      notionalSol: 520000,
      status: "matured",
      maturityAt: new Date("2025-10-01T00:00:00Z").toISOString(),
      lastPaymentAt: new Date("2025-09-16T00:00:00Z").toISOString(),
      ltv: 0.88,
      tags: ["Healthcare", "BR"],
    },
    {
      id: "coll-4",
      label: "Clinic D – Batch #1031",
      kind: "Receivable",
      notionalSol: 300000,
      status: "performing",
      maturityAt: new Date("2025-11-30T00:00:00Z").toISOString(),
      lastPaymentAt: new Date("2025-09-29T00:00:00Z").toISOString(),
      ltv: 0.80,
      tags: ["Healthcare", "BR"],
    },
    {
      id: "coll-5",
      label: "Clinic E – Batch #1026",
      kind: "Invoice",
      notionalSol: 400000,
      status: "repaid",
      maturityAt: new Date("2025-09-20T00:00:00Z").toISOString(),
      lastPaymentAt: new Date("2025-09-20T00:00:00Z").toISOString(),
      ltv: 0.85,
      tags: ["Healthcare", "BR"],
    },
    {
      id: "coll-6",
      label: "Liquidity Buffer",
      kind: "CashBuffer",
      notionalSol: 150000,
      status: "buffer",
      tags: ["Buffer"],
    },
  ];

  const deployedSol = items
    .filter(i => i.status === "performing" || i.status === "matured")
    .reduce((sum, i) => sum + i.notionalSol, 0);

  const liquidityBufferSol = items
    .filter(i => i.status === "buffer")
    .reduce((sum, i) => sum + i.notionalSol, 0);

  const totalNotionalSol = deployedSol + liquidityBufferSol;
  const performingCount = items.filter(i => i.status === "performing").length;
  const totalActiveCount = items.filter(i => i.status === "performing" || i.status === "matured").length;
  const performingPct = totalActiveCount > 0 ? (performingCount / totalActiveCount) * 100 : 0;

  const performingItems = items.filter(i => i.maturityAt && i.status === "performing");
  const avgMaturityDays = performingItems.length > 0
    ? Math.round(
        performingItems.reduce((sum, i) => {
          const days = Math.ceil((new Date(i.maturityAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / performingItems.length
      )
    : undefined;

  return {
    deployedSol,
    liquidityBufferSol,
    capRemainingSol: 2600000,
    totalNotionalSol,
    performingPct,
    avgMaturityDays,
    items,
  };
};

export const getMockParamChanges = (): ParamChange[] => {
  const baseUrl = "https://explorer.solana.com/tx";
  const cluster = "devnet";

  return [
    {
      id: "param-1",
      key: "Vault Cap",
      oldValue: 3000000,
      newValue: 5000000,
      ts: new Date("2025-07-01T00:00:00Z").toISOString(),
      txUrl: `${baseUrl}/PARAM1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9?cluster=${cluster}`,
    },
    {
      id: "param-2",
      key: "Liquidity Buffer %",
      oldValue: "5%",
      newValue: "6.25%",
      ts: new Date("2025-08-10T00:00:00Z").toISOString(),
      txUrl: `${baseUrl}/PARAM2A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9?cluster=${cluster}`,
    },
    {
      id: "param-3",
      key: "Principal Lockup",
      oldValue: "60 days",
      newValue: "90 days",
      ts: new Date("2025-06-15T00:00:00Z").toISOString(),
      txUrl: `${baseUrl}/PARAM3A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9?cluster=${cluster}`,
    },
    {
      id: "param-4",
      key: "Withdrawal Delay",
      oldValue: "1 day",
      newValue: "2 days",
      ts: new Date("2025-06-20T00:00:00Z").toISOString(),
      txUrl: `${baseUrl}/PARAM4A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9?cluster=${cluster}`,
    },
    {
      id: "param-5",
      key: "Liquidity Buffer SOL",
      oldValue: 100000,
      newValue: 150000,
      ts: new Date("2025-09-01T00:00:00Z").toISOString(),
      txUrl: `${baseUrl}/PARAM5A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9?cluster=${cluster}`,
    },
  ];
};
