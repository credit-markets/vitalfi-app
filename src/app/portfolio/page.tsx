"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMockUserData, getMockActivity } from "@/lib/solana/mock-data";
import { formatCurrency, formatNumber, formatPercentage, shortenAddress } from "@/lib/utils";
import { Wallet as WalletIcon, TrendingUp, Lock, Clock, Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ActivityFilter = "all" | "deposit" | "withdraw";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { isCollapsed } = useSidebar();
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const userData = connected ? getMockUserData(true) : getMockUserData(false);
  const allActivity = getMockActivity();

  // Filter to user's activity only (in mock, show all)
  const userActivity = filter === "all"
    ? allActivity
    : allActivity.filter(a => {
        if (filter === "withdraw") return a.type === "withdraw_request" || a.type === "claim";
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
      <Sidebar />

      <main
        className={cn(
          "pt-32 pb-16 transition-all duration-300",
          "lg:ml-16",
          !isCollapsed && "lg:ml-64"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 md:space-y-12">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              My Portfolio
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Your positions and activity in Healthy Yield
            </p>
          </div>

          {/* Balance Card */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-card border-primary/20">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-primary/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold">Your Balance</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Healthy Yield Vault</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">Deposited</div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {formatCurrency(userData.shareBalance)}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">Current Value</div>
                <div className="text-2xl sm:text-3xl font-bold text-accent">
                  {formatCurrency(userData.shareBalance * 1.02)}
                </div>
                <div className="text-xs text-green-500 mt-1">+{formatPercentage(2)} gain</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">APY Earning</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-500">
                  {formatPercentage(8.5)}
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Feed */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-card border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl sm:text-2xl font-bold">Your Activity</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="deposit">Deposits</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdrawals</TabsTrigger>
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
                            formatCurrency(activity.solAmount!)}
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
