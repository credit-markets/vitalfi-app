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
      <Card className="p-6 bg-card border border-primary/20">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="deposit">
              <TrendingUp className="w-4 h-4 mr-2" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw">
              <TrendingDown className="w-4 h-4 mr-2" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          {/* DEPOSIT TAB */}
          <TabsContent value="deposit" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (SOL)</label>
                {connected && (
                  <button
                    className="text-xs text-accent hover:underline"
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
                className="text-base h-12"
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
              className="w-full h-11"
              size="lg"
              disabled={!depositValid}
              onClick={handleDeposit}
            >
              {connected ? "Deposit SOL" : "Connect Wallet"}
            </Button>
          </TabsContent>

          {/* WITHDRAW TAB */}
          <TabsContent value="withdraw" className="space-y-4 mt-4">
            {/* Pending Withdrawal Card (if exists) */}
            {queue.pending && (
              <Card className="p-4 bg-accent/10 border-accent/30">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-accent" />
                  <div className="text-sm font-semibold">Pending Withdrawal</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {queue.pending.amountShares.toFixed(2)} shares → {queue.pending.estSol.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claim at</span>
                      <span className="font-medium text-xs">
                        {new Date(queue.pending.claimAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full mt-3"
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
                    className="text-xs text-accent hover:underline"
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
                className="text-base h-12"
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
              className="w-full h-11"
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
            <div className="text-xs text-muted-foreground text-center">
              Withdrawals require a {WITHDRAWAL_DELAY_DAYS}-day delay before claiming
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
