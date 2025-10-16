// Mock Vault Contract Addresses
export const MOCK_ADDRESSES = {
  programId: "VFi1111111111111111111111111111111111111111",
  vaultPda: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  authorityPda: "8xPZfG715bTx8DNjGmaS23yuVM1YWaqqqZa8OtrUein",
  tokenMint: "vTOK111111111111111111111111111111111111111",
  vaultTokenAccount: "So11111111111111111111111111111111111111112",
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
      txUrl: `${baseUrl}/L1L2L3L4L5L6L7L8L9LLLCLDLELFLGLHLILJLKLLMLNL?cluster=${cluster}`,
      status: "success" as const,
    },
    {
      id: "portfolio-2",
      tag: "Deposit" as const,
      ts: new Date("2025-08-02T14:20:00Z").toISOString(),
      amountSol: 50,
      shares: 50,
      txUrl: `${baseUrl}/B1B2B3B4B5B6B7B8B9BBBCBDBEBFBGBHBIBJBKBLBMBNB?cluster=${cluster}`,
      status: "success" as const,
    },
    {
      id: "portfolio-3",
      tag: "Deposit" as const,
      ts: new Date("2025-06-28T09:15:00Z").toISOString(),
      amountSol: 25,
      shares: 25,
      txUrl: `${baseUrl}/9M3N4O5pQrStUvWxYz1A2bCdEfGhIjKlMnOpQrStUvWx123456789MNO?cluster=${cluster}`,
      status: "success" as const,
    },
  ];
};

// Transparency mock data
