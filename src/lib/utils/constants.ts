// ===========================================================================
// VitalFi Application Constants
// ===========================================================================

// Feature flags
export const SHOW_3D_ACCENT = true; // Toggle 3D accent on/off
export const ACCENT_3D_MODE: "banner" | "orb" = "banner"; // 'banner' or 'orb'

// Solana configuration
export const CLUSTER: "mainnet-beta" | "devnet" | "testnet" = "devnet";
export const SOLSCAN_BASE_URL = "https://solscan.io";
export const SOLANA_EXPLORER_URL = "https://explorer.solana.com";
export const SOL_DECIMALS = 9; // Standard SOL token decimals

// Business constants
export const DEFAULT_ORIGINATOR = {
  id: "vitalfi",
  name: "VitalFi",
  country: "Brazil",
} as const;

export const DEFAULT_COLLATERAL_TYPE = "Medical Receivables";
