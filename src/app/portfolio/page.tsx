"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMockUserData, getMockActivity } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, formatPercentage, shortenAddress } from "@/lib/utils";
import { Wallet as WalletIcon, TrendingUp, Lock, Clock, Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ActivityFilter = "all" | "deposit" | "withdraw" | "yield_sell";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const userData = connected ? getMockUserData(true) : getMockUserData(false);
  const allActivity = getMockActivity();

  // Filter to user's activity only (in mock, show all)
  const userActivity = filter === "all"
    ? allActivity
    : allActivity.filter(a => {
        if (filter === "withdraw") return a.type === "withdraw_request" || a.type === "claim";
        if (filter === "yield_sell") return a.type === "yield_sell";
        return a.type === filter;
      });

  const copyTx = (sig: string) => {
    navigator.clipboard.writeText(sig);
    toast.success("Transaction signature copied!");
  };

  const exportCSV = () => {
    toast.success("CSV export coming soon!");
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <Card className="p-12 bg-gradient-card border-destructive/20 text-center">
              <WalletIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your portfolio
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4 space-y-12">
          {/* Page Header */}
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              My Portfolio
            </h1>
            <p className="text-muted-foreground mt-2">
              Your positions and activity in Healthy Yield
            </p>
          </div>

          {/* Balance Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* vPT Balance Card */}
            <Card className="p-8 bg-gradient-card border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">vPT Balance</h3>
                    <p className="text-sm text-muted-foreground">Principal Token</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatNumber(userData.vPTBalance)} vPT
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ {formatCurrency(userData.vPTBalance * 1.02)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Unlocked</div>
                    <div className="text-xl font-semibold text-accent">{formatNumber(userData.totalUnlocked)}</div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Locked</div>
                    <div className="text-xl font-semibold text-impact">{formatNumber(userData.totalLocked)}</div>
                  </div>
                </div>

                {userData.nextUnlockDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Next unlock: </span>
                    <span className="font-medium">{userData.nextUnlockDate.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* vYT Balance Card */}
            <Card className="p-8 bg-gradient-card border-accent/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">vYT Balance</h3>
                    <p className="text-sm text-muted-foreground">Yield Token</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-accent mb-2">
                    {formatNumber(userData.vYTBalance)} vYT
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Liquid & Transferable
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Current APR</span>
                    <Badge variant="outline" className="text-accent">
                      {formatPercentage(8.5)}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Est. Annual Yield: </span>
                    <span className="font-medium">{formatCurrency(userData.vYTBalance * 0.085)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  💡 Sell your vYT anytime on the vault page
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="p-8 bg-gradient-card border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Your Activity</h3>
              <div className="flex items-center gap-4">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="deposit">Deposits</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
                    <TabsTrigger value="yield_sell">Yield Sales</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No activity yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    userActivity.slice(0, 20).map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {activity.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.type === "deposit" && formatCurrency(activity.solAmount!)}
                          {(activity.type === "withdraw_request" || activity.type === "claim") &&
                            `${formatNumber(activity.vPTAmount!)} vPT`}
                          {activity.type === "yield_sell" &&
                            `${formatNumber(activity.vYTAmount!)} vYT`}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {activity.timestamp.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-background/50 px-2 py-1 rounded">
                              {shortenAddress(activity.signature, 3)}
                            </code>
                            <button onClick={() => copyTx(activity.signature)}>
                              <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                            </button>
                            <a
                              href={`https://explorer.solana.com/tx/${activity.signature}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.status === "success" ? "success" : "warning"}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
