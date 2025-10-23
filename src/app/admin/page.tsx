"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useVaultClient } from "@/hooks/wallet/use-vault-client";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/providers/SidebarContext";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const vaultClient = useVaultClient();
  const { isCollapsed } = useSidebar();

  // Initialize Vault Form State
  const [initForm, setInitForm] = useState({
    vaultId: "1",
    cap: "1",
    targetApyBps: "1200",
    fundingEndTs: "",
    maturityTs: "",
    minDeposit: "0.1",
    assetMint: "So11111111111111111111111111111111111111112", // Wrapped SOL
  });

  // Finalize Funding Form State
  const [finalizeForm, setFinalizeForm] = useState({
    vaultId: "1",
    assetMint: "So11111111111111111111111111111111111111112",
  });

  // Mature Vault Form State
  const [matureForm, setMatureForm] = useState({
    vaultId: "1",
    returnAmount: "1100",
    assetMint: "So11111111111111111111111111111111111111112",
  });

  // Close Vault Form State
  const [closeForm, setCloseForm] = useState({
    vaultId: "1",
  });

  const [loading, setLoading] = useState<string | null>(null);

  // Set default timestamps (10 minutes and 20 minutes from now)
  const getDefaultFundingEnd = () => {
    const now = Math.floor(Date.now() / 1000);
    return (now + 600).toString(); // 10 minutes from now
  };

  const getDefaultMaturity = () => {
    const now = Math.floor(Date.now() / 1000);
    return (now + 1200).toString(); // 20 minutes from now
  };

  const handleInitializeVault = async () => {
    if (!vaultClient || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading("initialize");
    try {
      const vaultId = new BN(initForm.vaultId);

      // Convert SOL to lamports (multiply by 10^9)
      const capSol = parseFloat(initForm.cap);
      const cap = new BN(Math.floor(capSol * 1_000_000_000));

      const targetApyBps = parseInt(initForm.targetApyBps);
      const fundingEndTs = new BN(
        initForm.fundingEndTs || getDefaultFundingEnd()
      );
      const maturityTs = new BN(initForm.maturityTs || getDefaultMaturity());

      // Convert SOL to lamports (multiply by 10^9)
      const minDepositSol = parseFloat(initForm.minDeposit);
      const minDeposit = new BN(Math.floor(minDepositSol * 1_000_000_000));

      const assetMint = new PublicKey(initForm.assetMint);

      const txSig = await vaultClient.initializeVault(
        vaultId,
        cap,
        targetApyBps,
        fundingEndTs,
        maturityTs,
        minDeposit,
        assetMint
      );

      toast.success(
        <div>
          Vault initialized!
          <br />
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-400"
          >
            View Transaction
          </a>
        </div>
      );
    } catch (error) {
      console.error("Failed to initialize vault:", error);
      toast.error(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(null);
    }
  };

  const handleFinalizeFunding = async () => {
    if (!vaultClient || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading("finalize");
    try {
      const vaultId = new BN(finalizeForm.vaultId);
      const assetMint = new PublicKey(finalizeForm.assetMint);

      const txSig = await vaultClient.finalizeFunding(vaultId, assetMint);

      toast.success(
        <div>
          Funding finalized!
          <br />
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-400"
          >
            View Transaction
          </a>
        </div>
      );
    } catch (error) {
      console.error("Failed to finalize funding:", error);
      toast.error(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(null);
    }
  };

  const handleMatureVault = async () => {
    if (!vaultClient || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading("mature");
    try {
      const vaultId = new BN(matureForm.vaultId);

      // Convert SOL to lamports (multiply by 10^9)
      const returnAmountSol = parseFloat(matureForm.returnAmount);
      const returnAmount = new BN(Math.floor(returnAmountSol * 1_000_000_000));

      const assetMint = new PublicKey(matureForm.assetMint);

      const txSig = await vaultClient.matureVault(
        vaultId,
        returnAmount,
        assetMint
      );

      toast.success(
        <div>
          Vault matured!
          <br />
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-400"
          >
            View Transaction
          </a>
        </div>
      );
    } catch (error) {
      console.error("Failed to mature vault:", error);
      toast.error(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(null);
    }
  };

  const handleCloseVault = async () => {
    if (!vaultClient || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    setLoading("close");
    try {
      const vaultId = new BN(closeForm.vaultId);

      const txSig = await vaultClient.closeVault(vaultId);

      toast.success(
        <div>
          Vault closed!
          <br />
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-cyan-400"
          >
            View Transaction
          </a>
        </div>
      );
    } catch (error) {
      console.error("Failed to close vault:", error);
      toast.error(
        `Failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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
                    placeholder="So11111111111111111111111111111111111111112"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Wrapped SOL by default
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
                    Vault ID
                  </label>
                  <Input
                    type="number"
                    value={finalizeForm.vaultId}
                    onChange={(e) =>
                      setFinalizeForm({
                        ...finalizeForm,
                        vaultId: e.target.value,
                      })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asset Mint
                  </label>
                  <Input
                    value={finalizeForm.assetMint}
                    onChange={(e) =>
                      setFinalizeForm({
                        ...finalizeForm,
                        assetMint: e.target.value,
                      })
                    }
                    placeholder="So11111111111111111111111111111111111111112"
                  />
                </div>
                <Button
                  onClick={handleFinalizeFunding}
                  disabled={loading === "finalize"}
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
                    Vault ID
                  </label>
                  <Input
                    type="number"
                    value={matureForm.vaultId}
                    onChange={(e) =>
                      setMatureForm({ ...matureForm, vaultId: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Return Amount (SOL)
                  </label>
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asset Mint
                  </label>
                  <Input
                    value={matureForm.assetMint}
                    onChange={(e) =>
                      setMatureForm({
                        ...matureForm,
                        assetMint: e.target.value,
                      })
                    }
                    placeholder="So11111111111111111111111111111111111111112"
                  />
                </div>
                <Button
                  onClick={handleMatureVault}
                  disabled={loading === "mature"}
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
                    Vault ID
                  </label>
                  <Input
                    type="number"
                    value={closeForm.vaultId}
                    onChange={(e) =>
                      setCloseForm({ ...closeForm, vaultId: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
                <Button
                  onClick={handleCloseVault}
                  disabled={loading === "close"}
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
