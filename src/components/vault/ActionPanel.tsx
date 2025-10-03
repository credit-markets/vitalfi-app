"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVaultStats } from "@/hooks/useVaultStats";
import { useUserQueue } from "@/hooks/useUserQueue";
import { calculateDepositPreview, getMockUserData } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { formatPricePerShare } from "@/lib/formatters";
import { TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { WITHDRAWAL_DELAY_DAYS } from "@/lib/constants";

/**
 * Sticky action panel for deposits and withdrawals
 * Two-step withdrawal: Request → Claim (with 2-day delay clearly communicated)
 */
export function ActionPanel() {
  const { connected } = useWallet();
  const stats = useVaultStats();
  const queue = useUserQueue();
  const [mainTab, setMainTab] = useState("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const userData = connected ? getMockUserData(true) : getMockUserData(false);
  const depositPreview = depositAmount ? calculateDepositPreview(parseFloat(depositAmount) || 0) : null;

  const handleDeposit = async () => {
    if (!connected || !depositAmount) return;

    toast.success(`Deposited ${depositAmount} SOL successfully!`);
    setDepositAmount("");
  };

  const handleRequestWithdrawal = async () => {
    if (!connected || !withdrawAmount) return;

    toast.success(`Withdrawal request created! Claim available in ${WITHDRAWAL_DELAY_DAYS} days.`);
    setWithdrawAmount("");
  };

  const handleClaim = async () => {
    if (!queue.pending) return;

    toast.success(`Claimed ${queue.pending.estSol.toFixed(2)} SOL!`);
  };

  // Validation
  const depositValid = connected && depositAmount && parseFloat(depositAmount) > 0;
  const withdrawValid = connected && withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= userData.shareBalance;

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <Card className="p-4 sm:p-6 bg-card border border-primary/20">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full grid grid-cols-2 h-11 sm:h-10">
            <TabsTrigger value="deposit" className="text-sm sm:text-base touch-manipulation">
              <TrendingUp className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Deposit</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-sm sm:text-base touch-manipulation">
              <TrendingDown className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Withdraw</span>
            </TabsTrigger>
          </TabsList>

          {/* DEPOSIT TAB */}
          <TabsContent value="deposit" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (SOL)</label>
                {connected && (
                  <button
                    className="text-xs text-accent hover:underline active:underline touch-manipulation p-1"
                    onClick={() => setDepositAmount("100")}
                  >
                    Max: 100 SOL
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!connected}
                className="text-base h-12 sm:h-12"
              />
            </div>

            {depositPreview && (
              <Card className="p-4 bg-muted/20 border-accent/20">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You&apos;ll Receive</span>
                    <span className="font-bold text-accent">
                      {formatNumber(depositPreview.sharesMinted)} Shares
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="font-medium text-green-500">
                      {formatPercentage(depositPreview.impliedAPY)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">{formatCurrency(depositPreview.fee)}</span>
                  </div>
                </div>
              </Card>
            )}

            {!connected && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Connect wallet to deposit</span>
              </div>
            )}

            <Button
              className="w-full h-12 text-base touch-manipulation"
              size="lg"
              disabled={!depositValid}
              onClick={handleDeposit}
            >
              {connected ? "Deposit SOL" : "Connect Wallet"}
            </Button>
          </TabsContent>

          {/* WITHDRAW TAB */}
          <TabsContent value="withdraw" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            {/* Pending Withdrawal Card (if exists) */}
            {queue.pending && (
              <Card className="p-3 sm:p-4 bg-accent/10 border-accent/30">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="text-sm font-semibold">Pending Withdrawal</div>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium text-right">
                      {queue.pending.amountShares.toFixed(2)} shares → {queue.pending.estSol.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`font-semibold ${
                        queue.canClaim ? "text-green-500" : "text-accent"
                      }`}
                    >
                      {queue.countdown}
                    </span>
                  </div>
                  {!queue.canClaim && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Claim at</span>
                      <span className="font-medium text-[10px] sm:text-xs text-right">
                        {new Date(queue.pending.claimAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full mt-3 h-10 text-sm touch-manipulation"
                  size="sm"
                  disabled={!queue.canClaim}
                  onClick={handleClaim}
                >
                  {queue.canClaim ? `Claim ${queue.pending.estSol.toFixed(2)} SOL` : "Claim Available Soon"}
                </Button>
              </Card>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (Shares)</label>
                {connected && (
                  <button
                    className="text-xs text-accent hover:underline active:underline touch-manipulation p-1"
                    onClick={() => setWithdrawAmount(userData.shareBalance.toString())}
                  >
                    Available: {formatNumber(userData.shareBalance)} shares
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!connected}
                className="text-base h-12 sm:h-12"
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <Card className="p-4 bg-muted/20 border-primary/20">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You&apos;ll Receive</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(parseFloat(withdrawAmount) * stats.pricePerShare)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span className="font-medium">{WITHDRAWAL_DELAY_DAYS} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per Share</span>
                    <span className="font-medium text-green-500">
                      {formatPricePerShare(stats.pricePerShare)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {!connected && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Connect wallet to withdraw</span>
              </div>
            )}

            <Button
              className="w-full h-12 text-base touch-manipulation"
              size="lg"
              disabled={!withdrawValid || !!queue.pending}
              onClick={handleRequestWithdrawal}
            >
              {queue.pending
                ? "Pending Withdrawal"
                : connected
                ? "Request Withdrawal"
                : "Connect Wallet"}
            </Button>

            {/* Help text */}
            <div className="text-[11px] sm:text-xs text-muted-foreground text-center">
              Withdrawals require a {WITHDRAWAL_DELAY_DAYS}-day delay before claiming
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
