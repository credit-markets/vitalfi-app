"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateDepositPreview, getMockUserData } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info, Wallet as WalletIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { VaultState } from "@/types/vault";

interface ActionCardProps {
  vaultState: VaultState;
}

export function ActionCard({ vaultState }: ActionCardProps) {
  const { connected } = useWallet();
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

  const handleWithdraw = async () => {
    if (!connected || !withdrawAmount) return;

    toast.success(`Withdrawal request created for ${withdrawAmount} SOL!`);
    setWithdrawAmount("");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Action Area */}
      <Card className="lg:col-span-2 p-8 bg-gradient-card border-primary/20">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              <TrendingDown className="w-4 h-4 mr-2" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          {/* DEPOSIT TAB */}
          <TabsContent value="deposit" className="space-y-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (SOL)</label>
                {connected && (
                  <button
                    className="text-sm text-accent hover:underline"
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
                className="text-lg h-14"
              />
            </div>

            {depositPreview && (
              <Card className="p-6 bg-background/50 border-accent/20">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You'll Receive</span>
                    <span className="font-bold text-lg text-accent">{formatNumber(depositPreview.sharesMinted)} Shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current APY</span>
                    <span className="font-medium text-green-500">{formatPercentage(depositPreview.impliedAPY)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">{formatCurrency(depositPreview.fee)}</span>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {!connected && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connect wallet to deposit</span>
                </div>
              )}
              <Button
                className="w-full h-12"
                size="lg"
                disabled={!connected || !depositAmount || parseFloat(depositAmount) <= 0}
                onClick={handleDeposit}
              >
                {connected ? "Deposit SOL" : "Connect Wallet"}
              </Button>
            </div>
          </TabsContent>

          {/* WITHDRAW TAB */}
          <TabsContent value="withdraw" className="space-y-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (SOL)</label>
                {connected && (
                  <button
                    className="text-sm text-accent hover:underline"
                    onClick={() => setWithdrawAmount(userData.shareBalance.toString())}
                  >
                    Available: {formatNumber(userData.shareBalance)} SOL
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={!connected}
                className="text-lg h-14"
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <Card className="p-6 bg-background/50 border-primary/20">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You'll Receive</span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(parseFloat(withdrawAmount) * vaultState.principalRedemptionValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span className="font-medium">~2 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Redemption Rate</span>
                    <span className="font-medium text-green-500">{formatNumber(vaultState.principalRedemptionValue)}x</span>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {!connected && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connect wallet to withdraw</span>
                </div>
              )}
              <Button
                className="w-full h-12"
                size="lg"
                disabled={!connected || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                onClick={handleWithdraw}
              >
                Request Withdrawal
              </Button>
            </div>

            {connected && userData.pendingWithdrawals.length > 0 && (
              <Card className="p-4 bg-accent/10 border-accent/20">
                <div className="text-sm font-medium mb-2">Pending Withdrawal</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>{formatCurrency(userData.pendingWithdrawals[0].estSolOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span>{new Date(userData.pendingWithdrawals[0].claimAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button className="w-full mt-3" size="sm" variant="outline">
                  Claim {formatCurrency(userData.pendingWithdrawals[0].estSolOut)}
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Info Panel */}
      <Card className="p-6 bg-gradient-card border-border/50 space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Vault Info
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Value Locked</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(vaultState.tvl, 0)}</div>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current APY</span>
                <span className="font-bold text-accent">{formatPercentage(vaultState.yieldAPR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redemption Rate</span>
                <span className="font-medium text-green-500">{formatNumber(vaultState.principalRedemptionValue)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cap Remaining</span>
                <span className="font-medium">{formatCurrency(vaultState.capRemaining, 0)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Processing</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queue Depth</span>
                  <span className="font-medium">{vaultState.queueDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Time</span>
                  <span className="font-medium">2 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!connected && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <WalletIcon className="w-4 h-4" />
              <span>Connect wallet to interact</span>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
