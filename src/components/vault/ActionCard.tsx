"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateDepositPreview, calculateWithdrawPreview, calculateYieldSellPreview, getMockUserData } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, formatPercentage, shortenAddress } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info, Copy, ExternalLink, Clock, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import type { VaultState } from "@/types/vault";

interface ActionCardProps {
  vaultState: VaultState;
}

export function ActionCard({ vaultState }: ActionCardProps) {
  const { connected, publicKey } = useWallet();
  const [mainTab, setMainTab] = useState("deposit");
  const [withdrawSubTab, setWithdrawSubTab] = useState("principal");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");

  const userData = connected ? getMockUserData(true) : getMockUserData(false);
  const depositPreview = depositAmount ? calculateDepositPreview(parseFloat(depositAmount) || 0) : null;
  const withdrawPreview = withdrawAmount ? calculateWithdrawPreview(parseFloat(withdrawAmount) || 0) : null;
  const yieldPreview = yieldAmount ? calculateYieldSellPreview(parseFloat(yieldAmount) || 0) : null;

  const handleDeposit = () => {
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }
    toast.success(`Deposited ${depositAmount} SOL!`);
    setDepositAmount("");
  };

  const handleWithdraw = () => {
    toast.success("Withdrawal request created!");
    setWithdrawAmount("");
  };

  const handleYieldSell = () => {
    toast.success(`Sold ${yieldAmount} vYT!`);
    setYieldAmount("");
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied!");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Action Area - 2 columns */}
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

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Amount (SOL)</label>
                {connected && (
                  <button
                    className="text-sm text-accent hover:underline"
                    onClick={() => setDepositAmount("100")}
                  >
                    Max
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={!connected}
              />
            </div>

            {depositPreview && (
              <Card className="p-6 bg-background/50 border-border/50 space-y-4">
                <h4 className="font-semibold text-foreground mb-3">Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      vPT Minted
                      <Tooltip content="Principal Token - locked for 90 days">
                        <Info className="w-3 h-3" />
                      </Tooltip>
                    </span>
                    <span className="font-medium">{formatNumber(depositPreview.vPTMinted)} vPT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unlock Date</span>
                    <span className="font-medium">{depositPreview.unlockDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      vYT Minted
                      <Tooltip content="Yield Token - liquid and transferable">
                        <Info className="w-3 h-3" />
                      </Tooltip>
                    </span>
                    <span className="font-medium">{formatNumber(depositPreview.vYTMinted)} vYT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Implied APY</span>
                    <span className="font-medium text-accent">{formatPercentage(depositPreview.impliedAPY)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">{formatCurrency(depositPreview.fee)}</span>
                  </div>
                </div>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!connected || !depositAmount}
              onClick={handleDeposit}
            >
              {connected ? "Deposit" : "Connect Wallet"}
            </Button>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-6">
            <Tabs value={withdrawSubTab} onValueChange={setWithdrawSubTab}>
              <TabsList className="w-full">
                <TabsTrigger value="principal" className="flex-1">Redeem Principal</TabsTrigger>
                <TabsTrigger value="yield" className="flex-1">Sell Yield</TabsTrigger>
              </TabsList>

              {/* Redeem Principal */}
              <TabsContent value="principal" className="space-y-4">
                {connected && userData.lots.length > 0 ? (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">
                      Your vPT Lots ({userData.totalUnlocked} unlocked / {userData.totalLocked} locked)
                    </div>
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Unlock Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userData.lots.map((lot) => (
                            <TableRow key={lot.id}>
                              <TableCell className="font-medium">{formatNumber(lot.amount)} vPT</TableCell>
                              <TableCell>{lot.unlockAt.toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={lot.status === "unlocked" ? "success" : "warning"}>
                                  {lot.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={lot.status === "unlocked" ? "default" : "outline"}
                                  disabled={lot.status === "locked"}
                                  onClick={handleWithdraw}
                                >
                                  {lot.status === "unlocked" ? "Withdraw" : "Locked"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {userData.pendingWithdrawals.length > 0 && (
                      <Card className="p-4 bg-background/50 border-accent/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-accent" />
                          <span className="font-semibold">Pending Withdrawal</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span>{formatNumber(userData.pendingWithdrawals[0].amount)} vPT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Claimable at</span>
                            <span>{userData.pendingWithdrawals[0].claimAt.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-3" size="sm" variant="outline">
                          Claim ({formatCurrency(userData.pendingWithdrawals[0].estSOL)})
                        </Button>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {connected ? "No vPT balance" : "Connect wallet to view"}
                  </div>
                )}
              </TabsContent>

              {/* Sell Yield */}
              <TabsContent value="yield" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">vYT Amount</label>
                    {connected && (
                      <span className="text-sm text-muted-foreground">
                        Balance: {formatNumber(userData.vYTBalance)} vYT
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={yieldAmount}
                    onChange={(e) => setYieldAmount(e.target.value)}
                    disabled={!connected}
                  />
                </div>

                {yieldPreview && (
                  <Card className="p-4 bg-background/50 border-border/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SOL Out</span>
                      <span className="font-medium">{formatCurrency(yieldPreview.solOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per vYT</span>
                      <span className="font-medium">{formatCurrency(yieldPreview.pricePerVYT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage</span>
                      <span className="font-medium text-impact">{formatPercentage(yieldPreview.slippage)}</span>
                    </div>
                  </Card>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!connected || !yieldAmount}
                  onClick={handleYieldSell}
                >
                  Sell Yield
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Info Panel - 1 column */}
      <Card className="p-6 bg-gradient-card border-border/50 space-y-6">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Vault Info
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Vault Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background/50 px-2 py-1 rounded">
                  {shortenAddress("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin")}
                </code>
                <button onClick={() => copyAddress("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin")}>
                  <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
                <a href="#" target="_blank" rel="noopener">
                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Current Rates</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>vPT Redemption</span>
                  <span className="font-medium">{formatNumber(vaultState.principalRedemptionValue)}x</span>
                </div>
                <div className="flex justify-between">
                  <span>vYT APR</span>
                  <span className="font-medium text-accent">{formatPercentage(vaultState.yieldAPR)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground mb-1">Queue Info</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Queue Depth</span>
                  <span className="font-medium">{vaultState.queueDepth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Claim Time</span>
                  <span className="font-medium">2 days</span>
                </div>
              </div>
            </div>

            {vaultState.nextRepaymentETA && (
              <div>
                <div className="text-muted-foreground mb-1">Next Repayment</div>
                <div className="font-medium">{vaultState.nextRepaymentETA.toLocaleDateString()}</div>
              </div>
            )}
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
