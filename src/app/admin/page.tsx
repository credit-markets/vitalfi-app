"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useVaultsAPI } from "@/hooks/api/use-vaults-api";
import { useTokenBalance } from "@/hooks/wallet/use-token-balance";
import {
  useInitializeVault,
  useFinalizeFunding,
  useMatureVault,
  useCloseVault,
} from "@/hooks/mutations";
import { validationError, walletConnectionError } from "@/lib/toast";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/providers/SidebarContext";
import { cn } from "@/lib/utils";
import { TOKEN_MINTS, getTokenSymbol, getTokenDecimals } from "@/lib/sdk/config";
import { env } from "@/lib/env";
import type { VaultDTO } from "@/lib/api/backend";

// Time constants for default vault configuration
const FUNDING_DURATION_SECONDS = 10 * 60; // 10 minutes
const MATURITY_DURATION_SECONDS = 20 * 60; // 20 minutes from now (10 min after funding)

// Validation constants
const MAX_VAULT_ID = 1_000_000; // Maximum reasonable vault ID
const MAX_CAP_SOL = 1_000_000_000; // 1 billion tokens max cap
const MAX_APY_BPS = 100_000; // 10,000% APY max (100,000 basis points)
const MAX_MIN_DEPOSIT = 1_000_000; // 1 million tokens max minimum deposit
const MIN_FUNDING_DURATION = 60; // 1 minute minimum
const MAX_FUNDING_DURATION = 365 * 24 * 60 * 60; // 1 year maximum

// Helper to format token amount with correct symbol and decimals
function formatTokenAmount(amountStr: string | null, mintAddress: string | null): string {
  if (!amountStr || !mintAddress) return '0';
  const decimals = getTokenDecimals(mintAddress);
  const symbol = getTokenSymbol(mintAddress);
  const amount = parseInt(amountStr) / Math.pow(10, decimals);
  return `${amount.toFixed(2)} ${symbol}`;
}

// Safe conversion from decimal to BN with proper precision
// Avoids floating point precision loss by using string multiplication
function decimalToBN(decimal: number, decimals: number): BN {
  // Convert to string to avoid floating point issues
  const decimalStr = decimal.toString();
  const [whole, fraction = ''] = decimalStr.split('.');

  // Pad or truncate fraction to match decimals
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);

  // Combine whole and fraction parts
  const combined = whole + paddedFraction;

  return new BN(combined);
}

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { isCollapsed } = useSidebar();

  // Mutation hooks with automatic retry logic
  const initializeVault = useInitializeVault();
  const finalizeFunding = useFinalizeFunding();
  const matureVault = useMatureVault();
  const closeVault = useCloseVault();

  // Fetch all vaults for the authority
  const { data: vaultsResponse, isLoading: vaultsLoading } = useVaultsAPI({
    authority: env.vaultAuthority,
    enabled: connected && !!env.vaultAuthority,
  });

  // Memoize vaults array to stabilize dependencies
  const vaults = useMemo(() => vaultsResponse?.items || [], [vaultsResponse?.items]);

  // Memoize filtered vault lists to avoid unnecessary re-renders
  const fundingVaults = useMemo(() => vaults.filter((v) => v.status === "Funding"), [vaults]);
  const activeVaults = useMemo(() => vaults.filter((v) => v.status === "Active"), [vaults]);
  const closableVaults = useMemo(() => vaults.filter((v) => v.status === "Matured" || v.status === "Canceled"), [vaults]);

  // Helper function to get selected vault
  const getSelectedVault = useMemo(() => {
    return (vaultPda: string): VaultDTO | undefined => {
      return vaults.find((v) => v.vaultPda === vaultPda);
    };
  }, [vaults]);

  // Mature Vault Form State
  const [matureForm, setMatureForm] = useState({
    vaultPda: "",
    returnAmount: "1100",
  });

  // Get selected vault for mature form to fetch token balance
  const selectedMatureVault = getSelectedVault(matureForm.vaultPda);
  const matureVaultTokenMint = selectedMatureVault?.assetMint || null;

  // Fetch token balance for the selected vault's token
  const { data: tokenBalance = 0, isLoading: balanceLoading } = useTokenBalance(matureVaultTokenMint);

  // Initialize Vault Form State
  const [initForm, setInitForm] = useState({
    vaultId: "1",
    cap: "100",
    targetApyBps: "1200",
    fundingEndTs: "",
    maturityTs: "",
    minDeposit: "1",
    assetMint: TOKEN_MINTS.USDT.DEVNET.toBase58(), // Devnet USDT
  });

  // Finalize Funding Form State
  const [finalizeForm, setFinalizeForm] = useState({
    vaultPda: "",
  });

  // Close Vault Form State
  const [closeForm, setCloseForm] = useState({
    vaultPda: "",
  });

  const [loading, setLoading] = useState<string | null>(null);

  // Set default timestamps (10 minutes and 20 minutes from now)
  const getDefaultFundingEnd = () => {
    const now = Math.floor(Date.now() / 1000);
    return (now + FUNDING_DURATION_SECONDS).toString();
  };

  const getDefaultMaturity = () => {
    const now = Math.floor(Date.now() / 1000);
    return (now + MATURITY_DURATION_SECONDS).toString();
  };

  const handleInitializeVault = async () => {
    if (!publicKey) {
      walletConnectionError();
      return;
    }

    // Input validation with max bounds
    // Reject scientific notation
    if (/[eE]/.test(initForm.vaultId) || /[eE]/.test(initForm.cap) ||
        /[eE]/.test(initForm.targetApyBps) || /[eE]/.test(initForm.minDeposit)) {
      validationError("Scientific notation is not allowed");
      return;
    }

    const vaultIdNum = parseInt(initForm.vaultId);
    if (isNaN(vaultIdNum) || vaultIdNum < 0 || vaultIdNum > MAX_VAULT_ID) {
      validationError(`Vault ID must be between 0 and ${MAX_VAULT_ID}`);
      return;
    }

    const capSol = parseFloat(initForm.cap);
    if (isNaN(capSol) || capSol <= 0 || capSol > MAX_CAP_SOL) {
      validationError(`Cap must be between 0 and ${MAX_CAP_SOL}`);
      return;
    }

    const targetApyBps = parseInt(initForm.targetApyBps);
    if (isNaN(targetApyBps) || targetApyBps < 0 || targetApyBps > MAX_APY_BPS) {
      validationError(`Target APY must be between 0 and ${MAX_APY_BPS} basis points`);
      return;
    }

    const minDepositSol = parseFloat(initForm.minDeposit);
    if (isNaN(minDepositSol) || minDepositSol <= 0 || minDepositSol > MAX_MIN_DEPOSIT) {
      validationError(`Minimum deposit must be between 0 and ${MAX_MIN_DEPOSIT}`);
      return;
    }

    const fundingEndTsStr = initForm.fundingEndTs || getDefaultFundingEnd();
    const maturityTsStr = initForm.maturityTs || getDefaultMaturity();

    const fundingEndTsNum = parseInt(fundingEndTsStr);
    const maturityTsNum = parseInt(maturityTsStr);
    const now = Math.floor(Date.now() / 1000);

    if (isNaN(fundingEndTsNum) || fundingEndTsNum <= now) {
      validationError("Funding end timestamp must be in the future");
      return;
    }

    const fundingDuration = fundingEndTsNum - now;
    if (fundingDuration < MIN_FUNDING_DURATION || fundingDuration > MAX_FUNDING_DURATION) {
      validationError(`Funding duration must be between ${MIN_FUNDING_DURATION}s and ${MAX_FUNDING_DURATION}s`);
      return;
    }

    if (isNaN(maturityTsNum) || maturityTsNum <= fundingEndTsNum) {
      validationError("Maturity timestamp must be after funding end");
      return;
    }

    const maturityDuration = maturityTsNum - fundingEndTsNum;
    if (maturityDuration < MIN_FUNDING_DURATION || maturityDuration > MAX_FUNDING_DURATION) {
      validationError(`Maturity duration must be between ${MIN_FUNDING_DURATION}s and ${MAX_FUNDING_DURATION}s`);
      return;
    }

    // Validate PublicKey format
    let assetMint: PublicKey;
    try {
      assetMint = new PublicKey(initForm.assetMint);
    } catch {
      validationError("Invalid asset mint address");
      return;
    }

    setLoading("initialize");
    try {
      const vaultId = new BN(vaultIdNum);

      // Get decimals for the token and convert using safe precision method
      const decimals = getTokenDecimals(initForm.assetMint);
      const cap = decimalToBN(capSol, decimals);

      const fundingEndTs = new BN(fundingEndTsNum);
      const maturityTs = new BN(maturityTsNum);

      // Convert using safe precision method
      const minDeposit = decimalToBN(minDepositSol, decimals);

      await initializeVault.mutateAsync({
        vaultId,
        cap,
        targetApyBps,
        fundingEndTs,
        maturityTs,
        minDeposit,
        assetMint,
      });
    } catch (error) {
      // Error already handled by mutation hook
      console.error("Failed to initialize vault:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleFinalizeFunding = async () => {
    if (!publicKey) {
      walletConnectionError();
      return;
    }

    // Input validation
    if (!finalizeForm.vaultPda) {
      validationError("Please select a vault");
      return;
    }

    const selectedVault = getSelectedVault(finalizeForm.vaultPda);
    if (!selectedVault) {
      validationError("Selected vault not found");
      return;
    }

    if (!selectedVault.vaultId || !selectedVault.assetMint || !selectedVault.authority) {
      validationError("Vault data incomplete");
      return;
    }

    // Validate PublicKey format
    let assetMint: PublicKey;
    let authority: PublicKey;
    try {
      assetMint = new PublicKey(selectedVault.assetMint);
      authority = new PublicKey(selectedVault.authority);
    } catch {
      validationError("Invalid asset mint or authority address in vault");
      return;
    }

    setLoading("finalize");
    try {
      const vaultId = new BN(selectedVault.vaultId);

      await finalizeFunding.mutateAsync({
        vaultId,
        authority,
        assetMint,
      });
    } catch (error) {
      // Error already handled by mutation hook
      console.error("Failed to finalize funding:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleMatureVault = async () => {
    if (!publicKey) {
      walletConnectionError();
      return;
    }

    // Input validation
    if (!matureForm.vaultPda) {
      validationError("Please select a vault");
      return;
    }

    const selectedVault = getSelectedVault(matureForm.vaultPda);
    if (!selectedVault) {
      validationError("Selected vault not found");
      return;
    }

    if (!selectedVault.vaultId || !selectedVault.assetMint || !selectedVault.authority) {
      validationError("Vault data incomplete");
      return;
    }

    const returnAmountSol = parseFloat(matureForm.returnAmount);
    if (isNaN(returnAmountSol) || returnAmountSol <= 0) {
      validationError("Return amount must be a positive number");
      return;
    }

    // Validate PublicKey format
    let assetMint: PublicKey;
    let authority: PublicKey;
    try {
      assetMint = new PublicKey(selectedVault.assetMint);
      authority = new PublicKey(selectedVault.authority);
    } catch {
      validationError("Invalid asset mint or authority address in vault");
      return;
    }

    setLoading("mature");
    try {
      const vaultId = new BN(selectedVault.vaultId);

      // Get decimals for the token and convert using safe precision method
      const decimals = getTokenDecimals(selectedVault.assetMint || '');
      const returnAmount = decimalToBN(returnAmountSol, decimals);

      await matureVault.mutateAsync({
        vaultId,
        authority,
        returnAmount,
        assetMint,
      });
    } catch (error) {
      // Error already handled by mutation hook
      console.error("Failed to mature vault:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleCloseVault = async () => {
    if (!publicKey) {
      walletConnectionError();
      return;
    }

    // Input validation
    if (!closeForm.vaultPda) {
      validationError("Please select a vault");
      return;
    }

    const selectedVault = getSelectedVault(closeForm.vaultPda);
    if (!selectedVault) {
      validationError("Selected vault not found");
      return;
    }

    if (!selectedVault.vaultId || !selectedVault.authority) {
      validationError("Vault data incomplete");
      return;
    }

    // Validate PublicKey format
    let authority: PublicKey;
    try {
      authority = new PublicKey(selectedVault.authority);
    } catch {
      validationError("Invalid authority address in vault");
      return;
    }

    setLoading("close");
    try {
      const vaultId = new BN(selectedVault.vaultId);

      await closeVault.mutateAsync({
        vaultId,
        authority,
      });
    } catch (error) {
      // Error already handled by mutation hook
      console.error("Failed to close vault:", error);
    } finally {
      setLoading(null);
    }
  };

  if (!connected) {
    return (
      <>
        <Header />
        <Sidebar />
        <main
          className={cn(
            "min-h-screen pt-20 pb-20 lg:pb-8 transition-all duration-300",
            isCollapsed ? "lg:pl-16" : "lg:pl-64"
          )}
        >
          <div className="container mx-auto px-4 py-8">
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
              <p className="text-gray-400">
                Please connect your wallet to access admin functions.
              </p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  /**
   * Client-side authorization check for UI access control.
   *
   * SECURITY NOTE: This check only controls UI visibility. The NEXT_PUBLIC_* variable
   * is embedded in the client bundle and visible to anyone. An attacker could bypass
   * this check using browser DevTools to access the UI.
   *
   * However, this is acceptable because:
   * 1. All actual vault operations require signing transactions with the authority's private key
   * 2. The Solana program enforces on-chain authorization checks
   * 3. An attacker without the private key cannot execute any privileged operations
   * 4. This UI check provides a clean UX for legitimate users
   *
   * For production, consider:
   * - Moving authorization to server-side API routes with session/JWT validation
   * - Using NextAuth or similar for proper admin authentication
   * - Rate limiting on sensitive endpoints
   */
  const isAuthorized = publicKey?.toBase58() === process.env.NEXT_PUBLIC_VAULT_AUTHORITY;

  if (!isAuthorized) {
    return (
      <>
        <Header />
        <Sidebar />
        <main
          className={cn(
            "min-h-screen pt-20 pb-20 lg:pb-8 transition-all duration-300",
            isCollapsed ? "lg:pl-16" : "lg:pl-64"
          )}
        >
          <div className="container mx-auto px-4 py-8">
            <Card className="p-8 text-center border-destructive/50">
              <h1 className="text-2xl font-bold mb-4 text-destructive">
                Access Denied
              </h1>
              <p className="text-gray-400 mb-4">
                You do not have permission to access the admin panel.
              </p>
              <p className="text-sm text-muted-foreground">
                Connected wallet: {publicKey?.toBase58()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Only the vault authority can access this page.
              </p>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <main
        className={cn(
          "min-h-screen pt-20 pb-20 lg:pb-8 transition-all duration-300",
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Vault Admin Panel</h1>
          <p className="text-gray-400 mb-8">
            Connected as: {publicKey?.toBase58()}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Initialize Vault */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">
                1. Initialize Vault
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vault ID
                  </label>
                  <Input
                    type="number"
                    value={initForm.vaultId}
                    onChange={(e) =>
                      setInitForm({ ...initForm, vaultId: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cap (SOL)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={initForm.cap}
                    onChange={(e) =>
                      setInitForm({ ...initForm, cap: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target APY (basis points)
                  </label>
                  <Input
                    type="number"
                    value={initForm.targetApyBps}
                    onChange={(e) =>
                      setInitForm({ ...initForm, targetApyBps: e.target.value })
                    }
                    placeholder="1200"
                  />
                  <p className="text-xs text-gray-500 mt-1">1200 = 12% APY</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Funding End (Unix timestamp)
                  </label>
                  <Input
                    type="number"
                    value={initForm.fundingEndTs}
                    onChange={(e) =>
                      setInitForm({ ...initForm, fundingEndTs: e.target.value })
                    }
                    placeholder={getDefaultFundingEnd()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for 10 minutes from now
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maturity (Unix timestamp)
                  </label>
                  <Input
                    type="number"
                    value={initForm.maturityTs}
                    onChange={(e) =>
                      setInitForm({ ...initForm, maturityTs: e.target.value })
                    }
                    placeholder={getDefaultMaturity()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for 20 minutes from now
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min Deposit (SOL)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={initForm.minDeposit}
                    onChange={(e) =>
                      setInitForm({ ...initForm, minDeposit: e.target.value })
                    }
                    placeholder="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asset Mint
                  </label>
                  <Input
                    value={initForm.assetMint}
                    onChange={(e) =>
                      setInitForm({ ...initForm, assetMint: e.target.value })
                    }
                    placeholder={TOKEN_MINTS.USDT.DEVNET.toBase58()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Devnet USDT token mint address
                  </p>
                </div>
                <Button
                  onClick={handleInitializeVault}
                  disabled={loading === "initialize"}
                  className="w-full"
                >
                  {loading === "initialize"
                    ? "Initializing..."
                    : "Initialize Vault"}
                </Button>
              </div>
            </Card>

            {/* Finalize Funding */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">
                2. Finalize Funding
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Call after funding period ends. If 2/3 funded, vault activates
                and funds are sent to authority.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Vault (Funding status)
                  </label>
                  <Select
                    value={finalizeForm.vaultPda}
                    onChange={(e) =>
                      setFinalizeForm({
                        ...finalizeForm,
                        vaultPda: e.target.value,
                      })
                    }
                    disabled={vaultsLoading}
                  >
                    <option value="">
                      {vaultsLoading ? "Loading vaults..." : "Select a vault"}
                    </option>
                    {fundingVaults.map((vault) => (
                      <option key={vault.vaultPda} value={vault.vaultPda}>
                        Vault #{vault.vaultId} - {vault.status} - {formatTokenAmount(vault.totalDeposited, vault.assetMint)} / {formatTokenAmount(vault.cap, vault.assetMint)}
                      </option>
                    ))}
                  </Select>
                  {finalizeForm.vaultPda && getSelectedVault(finalizeForm.vaultPda) && (
                    <div className="mt-3 p-3 bg-card border border-border/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getSelectedVault(finalizeForm.vaultPda)?.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          PDA: {finalizeForm.vaultPda.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleFinalizeFunding}
                  disabled={loading === "finalize" || !finalizeForm.vaultPda}
                  className="w-full"
                >
                  {loading === "finalize"
                    ? "Finalizing..."
                    : "Finalize Funding"}
                </Button>
              </div>
            </Card>

            {/* Mature Vault */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">
                3. Mature Vault
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Return principal + yield to the vault. This sets the payout
                ratio for user claims.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Vault (Active status)
                  </label>
                  <Select
                    value={matureForm.vaultPda}
                    onChange={(e) =>
                      setMatureForm({
                        ...matureForm,
                        vaultPda: e.target.value,
                      })
                    }
                    disabled={vaultsLoading}
                  >
                    <option value="">
                      {vaultsLoading ? "Loading vaults..." : "Select a vault"}
                    </option>
                    {activeVaults.map((vault) => (
                      <option key={vault.vaultPda} value={vault.vaultPda}>
                        Vault #{vault.vaultId} - {vault.status} - {formatTokenAmount(vault.totalDeposited, vault.assetMint)} deposited
                      </option>
                    ))}
                  </Select>
                  {matureForm.vaultPda && getSelectedVault(matureForm.vaultPda) && (
                    <div className="mt-3 p-3 bg-card border border-border/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getSelectedVault(matureForm.vaultPda)?.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          PDA: {matureForm.vaultPda.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Deposited: <span className="font-medium text-foreground">{formatTokenAmount(getSelectedVault(matureForm.vaultPda)?.totalDeposited || null, getSelectedVault(matureForm.vaultPda)?.assetMint || null)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Return Amount {matureForm.vaultPda && selectedMatureVault && `(${getTokenSymbol(selectedMatureVault.assetMint || '')})`}
                    </label>
                    {matureForm.vaultPda && selectedMatureVault && (
                      <div className="text-xs text-muted-foreground">
                        {balanceLoading ? (
                          "Loading balance..."
                        ) : (
                          <>
                            Balance:{" "}
                            <button
                              type="button"
                              onClick={() =>
                                setMatureForm({
                                  ...matureForm,
                                  returnAmount: tokenBalance.toFixed(2),
                                })
                              }
                              className="font-medium text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                            >
                              {tokenBalance.toFixed(2)} {getTokenSymbol(selectedMatureVault.assetMint || '')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={matureForm.returnAmount}
                    onChange={(e) =>
                      setMatureForm({
                        ...matureForm,
                        returnAmount: e.target.value,
                      })
                    }
                    placeholder="1100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Principal + yield (e.g., 1000 + 100 = 1100)
                  </p>
                </div>
                <Button
                  onClick={handleMatureVault}
                  disabled={loading === "mature" || !matureForm.vaultPda}
                  className="w-full"
                >
                  {loading === "mature" ? "Maturing..." : "Mature Vault"}
                </Button>
              </div>
            </Card>

            {/* Close Vault */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">
                4. Close Vault
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Reclaim rent after all users have claimed. Vault must have zero
                (or dust) balance.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Vault (Matured/Canceled status)
                  </label>
                  <Select
                    value={closeForm.vaultPda}
                    onChange={(e) =>
                      setCloseForm({ ...closeForm, vaultPda: e.target.value })
                    }
                    disabled={vaultsLoading}
                  >
                    <option value="">
                      {vaultsLoading ? "Loading vaults..." : "Select a vault"}
                    </option>
                    {closableVaults.map((vault) => (
                      <option key={vault.vaultPda} value={vault.vaultPda}>
                        Vault #{vault.vaultId} - {vault.status} - Claimed: {formatTokenAmount(vault.totalClaimed, vault.assetMint)}
                      </option>
                    ))}
                  </Select>
                  {closeForm.vaultPda && getSelectedVault(closeForm.vaultPda) && (
                    <div className="mt-3 p-3 bg-card border border-border/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getSelectedVault(closeForm.vaultPda)?.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          PDA: {closeForm.vaultPda.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Total Deposited: <span className="font-medium text-foreground">{formatTokenAmount(getSelectedVault(closeForm.vaultPda)?.totalDeposited || null, getSelectedVault(closeForm.vaultPda)?.assetMint || null)}</span></div>
                        <div>Total Claimed: <span className="font-medium text-foreground">{formatTokenAmount(getSelectedVault(closeForm.vaultPda)?.totalClaimed || null, getSelectedVault(closeForm.vaultPda)?.assetMint || null)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleCloseVault}
                  disabled={loading === "close" || !closeForm.vaultPda}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading === "close" ? "Closing..." : "Close Vault"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Info Section */}
          <Card className="p-6 mt-8 bg-gray-800/50">
            <h3 className="text-lg font-bold mb-4">Workflow Guide</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>
                <strong>Initialize Vault:</strong> Create a new vault with
                funding parameters
              </li>
              <li>
                <strong>Users Deposit:</strong> Users can deposit into the vault
                during the funding period (use main app)
              </li>
              <li>
                <strong>Finalize Funding:</strong> After funding ends, call this
                to check if 2/3 threshold met
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>
                    If successful: Vault becomes Active, funds sent to authority
                  </li>
                  <li>
                    If failed: Vault becomes Canceled, users can claim refunds
                  </li>
                </ul>
              </li>
              <li>
                <strong>Mature Vault:</strong> After maturity date, return
                principal + yield
              </li>
              <li>
                <strong>Users Claim:</strong> Users claim their proportional
                payouts (use main app)
              </li>
              <li>
                <strong>Close Vault:</strong> Once all claims processed, close
                vault to reclaim rent
              </li>
            </ol>
          </Card>
        </div>
      </main>
    </>
  );
}
