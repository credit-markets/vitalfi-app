import type {
  VaultSummary,
  VaultTransparencyData,
  Receivable,
  ReceivableStatus,
  CollateralAnalytics,
  HedgePosition,
  OriginatorInfo,
  VaultFundingInfo,
} from "@/types/vault";
import { MOCK_ADDRESSES } from "@/lib/solana/mock-data";

// Mock originators
const originators: Record<string, OriginatorInfo> = {
  saude_plus: {
    id: "saude_plus",
    name: "Saúde+ Clínica",
    country: "BR",
    note: "Multi-specialty medical clinic serving 500+ patients/month in São Paulo",
    website: "https://saudeplus.com.br",
  },
  vida_med: {
    id: "vida_med",
    name: "VidaMed Hospital",
    country: "BR",
    note: "Regional hospital network with emergency and surgical services",
    website: "https://vidamed.com.br",
  },
};

// Helper to calculate days to/past maturity
function calculateDays(maturityDate: string): { daysToMaturity?: number; daysPastDue?: number } {
  const now = new Date();
  const maturity = new Date(maturityDate);

  // Validate date
  if (isNaN(maturity.getTime())) {
    console.warn('Invalid maturity date detected', { maturityDate });
    return {}; // Return empty object if invalid date
  }

  const diffMs = maturity.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return { daysToMaturity: diffDays };
  } else {
    return { daysPastDue: Math.abs(diffDays) };
  }
}

// Generate realistic receivables
function generateReceivables(count: number, baseDate: Date, status: ReceivableStatus): Receivable[] {
  const receivables: Receivable[] = [];
  const payers = [
    "SUS - Sistema Único de Saúde",
    "Unimed São Paulo",
    "Bradesco Saúde",
    "Amil Assistência Médica",
    "Sul América Seguros",
    "Golden Cross",
  ];

  for (let i = 0; i < count; i++) {
    const faceValue = 1000 + Math.random() * 9000; // 1k-10k SOL equivalent
    const advancePct = 0.75 + Math.random() * 0.15; // 75-90% advance rate
    const costBasis = faceValue * advancePct;
    const issueDate = new Date(baseDate);
    issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60)); // 0-60 days ago
    const maturityDate = new Date(issueDate);
    maturityDate.setDate(maturityDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 30-90 day terms

    const originator = Math.random() > 0.5 ? "Saúde+ Clínica" : "VidaMed Hospital";
    const payer = payers[Math.floor(Math.random() * payers.length)];

    receivables.push({
      id: `INV-${(i + 1).toString().padStart(4, '0')}`,
      originator,
      payer,
      currency: 'BRL',
      faceValue: parseFloat(faceValue.toFixed(2)),
      costBasis: parseFloat(costBasis.toFixed(2)),
      advancePct: parseFloat(advancePct.toFixed(4)),
      expectedRepayment: parseFloat(faceValue.toFixed(2)),
      issueDate: issueDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      ...calculateDays(maturityDate.toISOString()),
      status,
      links: {
        invoiceUrl: `https://docs.vitalfi.io/invoices/INV-${i + 1}.pdf`,
        assignmentUrl: `https://docs.vitalfi.io/assignments/ASG-${i + 1}.pdf`,
        txUrl: `https://solscan.io/tx/${Math.random().toString(36).substring(2, 15)}`,
      },
      notes: status === 'Disputed' ? 'Payment delayed due to administrative review' : undefined,
    });
  }

  return receivables;
}

// Calculate analytics from receivables
function calculateAnalytics(receivables: Receivable[]): CollateralAnalytics {
  const faceValueTotal = receivables.reduce((sum, r) => sum + r.faceValue, 0);
  const costBasisTotal = receivables.reduce((sum, r) => sum + r.costBasis, 0);
  const outstandingTotal = receivables.filter(r => r.status === 'Performing' || r.status === 'Matured').reduce((sum, r) => sum + r.expectedRepayment, 0);

  // Calculate WAL (weighted average life)
  const totalNotional = receivables.reduce((sum, r) => sum + r.faceValue, 0);
  const weightedDays = receivables.reduce((sum, r) => {
    const days = r.daysToMaturity || 0;
    return sum + (r.faceValue / totalNotional) * days;
  }, 0);

  // Top originator concentration
  const originatorTotals: Record<string, number> = {};
  receivables.forEach(r => {
    originatorTotals[r.originator] = (originatorTotals[r.originator] || 0) + r.faceValue;
  });
  const originatorValues = Object.values(originatorTotals);
  const topOriginatorPct = originatorValues.length > 0 && faceValueTotal > 0
    ? Math.max(...originatorValues) / faceValueTotal
    : 0;

  // Top payer concentration
  const payerTotals: Record<string, number> = {};
  receivables.forEach(r => {
    payerTotals[r.payer] = (payerTotals[r.payer] || 0) + r.faceValue;
  });
  const payerValues = Object.values(payerTotals);
  const topPayerPct = payerValues.length > 0 && faceValueTotal > 0
    ? Math.max(...payerValues) / faceValueTotal
    : 0;

  return {
    receivableCount: receivables.length,
    faceValueTotal: parseFloat(faceValueTotal.toFixed(2)),
    costBasisTotal: parseFloat(costBasisTotal.toFixed(2)),
    outstandingTotal: parseFloat(outstandingTotal.toFixed(2)),
    weightedAvgLifeDays: Math.round(weightedDays),
    topOriginatorPct: parseFloat(topOriginatorPct.toFixed(4)),
    topPayerPct: parseFloat(topPayerPct.toFixed(4)),
  };
}

// Mock vault summaries (all stages)
export function getMockTransparencyVaults(): VaultSummary[] {
  const now = new Date();

  const maturityFunding = new Date(now);
  maturityFunding.setDate(maturityFunding.getDate() + 240); // 8 months out

  const maturityFunded = new Date(now);
  maturityFunded.setDate(maturityFunded.getDate() + 180); // 6 months out

  const maturityMatured = new Date(now);
  maturityMatured.setDate(maturityMatured.getDate() - 30); // matured 30 days ago

  return [
    {
      id: "vault-001",
      title: "Medical Receivables Brazil Q4 2025",
      status: "Active",
      raised: 450000,
      cap: 500000,
      targetApy: 0.12,
      maturityDate: maturityFunded.toISOString(),
      originator: originators.saude_plus,
    },
    {
      id: "vault-002",
      title: "Healthcare Factoring Pool Q4",
      status: "Matured",
      raised: 300000,
      cap: 300000,
      targetApy: 0.105,
      maturityDate: maturityMatured.toISOString(),
      originator: originators.vida_med,
    },
    {
      id: "vault-003",
      title: "SME Receivables Brazil Q1 2026",
      status: "Funding",
      raised: 180000,
      cap: 400000,
      targetApy: 0.135,
      maturityDate: maturityFunding.toISOString(),
      originator: originators.saude_plus,
    },
  ];
}

// Mock vault transparency data
export function getMockVaultTransparency(vaultId: string): VaultTransparencyData {
  const vaults = getMockTransparencyVaults();
  const vault = vaults.find(v => v.id === vaultId);

  if (!vault) {
    throw new Error(`Vault ${vaultId} not found`);
  }

  // Generate receivables based on vault status
  const baseDate = new Date();
  let receivables: Receivable[];

  if (vault.status === "Active") {
    // Active vault: mostly performing, some matured
    receivables = [
      ...generateReceivables(35, baseDate, 'Performing'),
      ...generateReceivables(8, baseDate, 'Matured'),
    ];
  } else {
    // Matured vault: mostly repaid, some still outstanding
    receivables = [
      ...generateReceivables(25, baseDate, 'Repaid'),
      ...generateReceivables(5, baseDate, 'Matured'),
    ];
  }

  const analytics = calculateAnalytics(receivables);

  // Hedge position (only for funded vaults with BRL exposure)
  const fundingStart = new Date();
  fundingStart.setDate(fundingStart.getDate() - 60); // started 60 days ago

  const hedge: HedgePosition | undefined = vault.status === "Active" ? {
    coveragePct: 0.85,
    instrument: 'NDF',
    pair: 'USD/BRL',
    notional: vault.raised * 0.85,
    tenorStart: fundingStart.toISOString(),
    tenorEnd: vault.maturityDate,
    referenceRate: 'PTAX',
    mtm: -2500, // negative MTM (hedge cost)
    realizedPnL: 0,
    counterparty: 'Itaú BBA',
    venue: 'B3',
    basisNote: 'Small basis risk exists between medical receivable maturities and NDF settlement dates',
  } : undefined;

  // Documents
  const documents = {
    files: [
      {
        id: 'doc-1',
        name: 'Term Sheet.pdf',
        type: 'pdf' as const,
        url: `https://docs.vitalfi.io/${vaultId}/term-sheet.pdf`,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc-2',
        name: 'Collateral Schedule.csv',
        type: 'csv' as const,
        url: `https://docs.vitalfi.io/${vaultId}/collateral.csv`,
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc-3',
        name: 'Purchase Agreement.pdf',
        type: 'pdf' as const,
        url: `https://docs.vitalfi.io/${vaultId}/purchase-agreement.pdf`,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc-4',
        name: 'Servicing Agreement.pdf',
        type: 'pdf' as const,
        url: `https://docs.vitalfi.io/${vaultId}/servicing.pdf`,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc-5',
        name: 'Monthly Report - Current.pdf',
        type: 'pdf' as const,
        url: `https://docs.vitalfi.io/${vaultId}/report-current.pdf`,
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  if (hedge) {
    documents.files.push({
      id: 'doc-6',
      name: 'Hedge Confirmation.pdf',
      type: 'pdf' as const,
      url: `https://docs.vitalfi.io/${vaultId}/hedge-confirmation.pdf`,
      uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return {
    summary: vault,
    collateral: {
      analytics,
      items: receivables,
    },
    hedge,
    documents,
    lastUpdated: new Date().toISOString(),
  };
}

// CSV export function
export async function exportReceivablesCsv(
  vaultId: string,
  receivables: Receivable[]
): Promise<Blob> {
  const headers = [
    'ID',
    'Originator',
    'Payer',
    'Currency',
    'Face Value',
    'Cost Basis',
    'Advance %',
    'Expected Repayment',
    'Issue Date',
    'Maturity Date',
    'Days to Maturity',
    'Days Past Due',
    'Status',
    'Invoice URL',
    'Assignment URL',
    'Tx URL',
  ];

  const rows = receivables.map(r => [
    r.id,
    r.originator,
    r.payer,
    r.currency,
    r.faceValue.toString(),
    r.costBasis.toString(),
    (r.advancePct * 100).toFixed(2) + '%',
    r.expectedRepayment.toString(),
    r.issueDate || '',
    r.maturityDate,
    r.daysToMaturity?.toString() || '',
    r.daysPastDue?.toString() || '',
    r.status,
    r.links?.invoiceUrl || '',
    r.links?.assignmentUrl || '',
    r.links?.txUrl || '',
  ]);

  // Sanitize cells to prevent CSV injection
  const sanitizeCell = (value: string | number): string => {
    const str = String(value);
    // If cell starts with formula characters or tab, prefix with single quote
    // Protects against =cmd, +cmd, -cmd, @cmd, and tab injection attacks
    if (str.match(/^[=+\-@\t]/)) {
      return `'${str}`;
    }
    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${sanitizeCell(cell)}"`).join(',')),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Get mock funding vault info (for vault detail page)
export function getMockFundingVaultInfo(vaultId: string): VaultFundingInfo {
  const vaults = getMockTransparencyVaults();
  const vault = vaults.find(v => v.id === vaultId);

  if (!vault) {
    throw new Error(`Vault ${vaultId} not found`);
  }

  // Calculate funding dates relative to maturity
  // Timeline: funding start -> funding end (45 days later) -> maturity (150 days after funding end)
  const maturityDate = new Date(vault.maturityDate);

  // Calculate funding end date (150 days before maturity)
  const fundingEndAt = new Date(maturityDate);
  fundingEndAt.setDate(fundingEndAt.getDate() - 150);

  return {
    status: vault.status, // Status comes from backend
    name: vault.title,
    expectedApyPct: vault.targetApy * 100, // Convert decimal to percentage
    capSol: vault.cap,
    minInvestmentSol: 100,
    raisedSol: vault.raised,
    totalClaimedSol: 0,
    fundingEndAt: fundingEndAt.toISOString(),
    maturityAt: vault.maturityDate,
    originator: vault.originator.name,
    payoutNum: null,
    payoutDen: null,
    addresses: MOCK_ADDRESSES,
  };
}
