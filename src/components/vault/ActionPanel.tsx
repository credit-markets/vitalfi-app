"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVaultAPI } from "@/hooks/vault/use-vault-api";
import { useDeposit } from "@/hooks/mutations";
import { env } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTokenDecimals } from "@/lib/sdk/config";
import { TrendingUp, AlertCircle, Info } from "lucide-react";
import { useWalletBalance } from "@/hooks/wallet/use-wallet-balance";
import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";

export interface ActionPanelProps {
  vaultId: string;
}

/**
 * Single action panel for vault participation (deposits only during funding)
 * Disabled states: "Funding closed" or "Cap reached"
 */
export function ActionPanel({ vaultId }: ActionPanelProps) {
  const { connected } = useWallet();
  const { info, computed } = useVaultAPI(vaultId);
  const [depositAmount, setDepositAmount] = useState("");
  const deposit = useDeposit();
  const { data: walletBalance = 0 } = useWalletBalance();

  // Early return if data not loaded (error state handled by parent)
  if (!info || !computed) {
    return null;
  }

  const amountNum = parseFloat(depositAmount) || 0;

  // Validation
  const isBelowMin = amountNum > 0 && amountNum < info.minInvestmentSol;
  const isAboveCap = amountNum > computed.capRemainingSol;
  const isValid =
    connected &&
    amountNum >= info.minInvestmentSol &&
    amountNum <= computed.capRemainingSol;

  // Disabled state messages
  const getDisabledMessage = () => {
    if (info.stage === "Funded" || info.stage === "Matured") {
      return {
        title: "Funding Closed",
        message:
          "Funding phase has ended. Await maturity for principal + yield distribution.",
      };
    }
    if (computed.capRemainingSol <= 0) {
      return {
        title: "Cap Reached",
        message: "Vault has reached maximum capacity. Funding is now closed.",
      };
    }
    return null;
  };

  const disabledMessage = getDisabledMessage();

  const handleDeposit = async () => {
    if (!isValid || !info) return;

    try {
      // Get vault configuration from backend API data
      const authority = new PublicKey(env.vaultAuthority);
      const vaultIdBN = new BN(vaultId);
      const assetMint = info.addresses.tokenMint
        ? new PublicKey(info.addresses.tokenMint)
        : new PublicKey("So11111111111111111111111111111111111111112"); // SOL

      // Convert amount to base units using token decimals
      const decimals = getTokenDecimals(assetMint);
      const baseUnits = new BN(Math.floor(amountNum * 10 ** decimals));

      // Execute deposit transaction
      await deposit.mutateAsync({
        vaultId: vaultIdBN,
        authority,
        amount: baseUnits,
        assetMint,
      });

      // Success - clear input (toast notification is automatic)
      setDepositAmount("");
    } catch (error) {
      // Error toast is automatic
      console.error("Deposit failed:", error);
    }
  };

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="p-4 sm:p-6 bg-card border border-primary/20">
        <div className="space-y-4 sm:space-y-5">
          {/* Title */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg sm:text-xl font-bold">
              Participate in Vault
            </h3>
          </div>

          {/* Disabled State Banner */}
          {disabledMessage && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm mb-1">
                    {disabledMessage.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {disabledMessage.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deposit Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Amount (SOL)</label>
              {connected && computed.canDeposit && (
                <button
                  className="text-xs text-foreground hover:underline active:underline touch-manipulation p-1"
                  onClick={() => {
                    const maxDeposit = Math.min(walletBalance, computed.capRemainingSol);
                    setDepositAmount(maxDeposit.toFixed(4));
                  }}
                >
                  Max: {formatCurrency(walletBalance)} SOL
                </button>
              )}
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={!connected || !computed.canDeposit}
              className="text-base h-12 sm:h-12"
            />

            {/* Validation Errors */}
            {isBelowMin && (
              <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>
                  Minimum investment: {formatCurrency(info.minInvestmentSol)}{" "}
                  SOL
                </span>
              </div>
            )}
            {isAboveCap && (
              <div className="mt-2 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>
                  Amount exceeds available capacity:{" "}
                  {formatCurrency(computed.capRemainingSol)} SOL
                </span>
              </div>
            )}
          </div>

          {/* Preview Info */}
          {amountNum >= info.minInvestmentSol && !isAboveCap && (
            <Card className="p-4 bg-muted/20 border-border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You Invest</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(amountNum)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected APY</span>
                  <span className="font-medium text-green-500">
                    {info.expectedApyPct.toFixed(1)}% p.y.
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Est. Return at Maturity
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      amountNum *
                        (1 +
                          (info.expectedApyPct / 100) *
                            (computed.daysToMaturity / 365))
                    )}{" "}
                    SOL
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Connect Wallet Notice */}
          {!connected && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Connect wallet to participate</span>
            </div>
          )}

          {/* Deposit Button */}
          <Button
            className="w-full h-12 text-base touch-manipulation"
            size="lg"
            disabled={!isValid || !!disabledMessage || deposit.isPending}
            onClick={handleDeposit}
          >
            {deposit.isPending
              ? "Processing..."
              : !connected
              ? "Connect Wallet"
              : disabledMessage
              ? disabledMessage.title
              : "Deposit SOL"}
          </Button>

          {/* Help Text */}
          {computed.canDeposit && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Funds locked until maturity ({formatDate(info.maturityAt)}).
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
