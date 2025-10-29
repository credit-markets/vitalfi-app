/**
 * Jupiter V6 API Types
 * Documentation: https://station.jup.ag/docs/apis/swap-api
 */

export interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
}

export interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  amount: string; // Base units (with decimals)
  slippageBps?: number; // Default 50 = 0.5%
  swapMode?: "ExactIn" | "ExactOut";
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
}

export interface JupiterRoutePlan {
  swapInfo: {
    ammKey: string;
    label?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: JupiterRoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  trackingAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number | "auto";
  asLegacyTransaction?: boolean;
  useTokenLedger?: boolean;
  destinationTokenAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  skipUserAccountsRpcCalls?: boolean;
}

export interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded serialized transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}

export interface SwapPreview {
  inputToken: JupiterToken;
  outputToken: JupiterToken;
  inputAmount: number; // Human readable
  outputAmount: number; // Human readable
  priceImpact: number; // Percentage
  minimumReceived: number; // After slippage
  fee: number; // In output token terms
  route: string[]; // AMM names/labels
  slippageBps: number;
}

export interface SwapExecutionResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  inputToken: string;
  outputToken: string;
}
