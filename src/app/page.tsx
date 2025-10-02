"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Earn Yield. Empower Healthcare.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Deposit SOL in a transparent DeFi vault backed by Brazilian medical receivables. Unlock
              faster cash flow for healthcare providers while earning sustainable real-world yield.
            </p>

            {!connected && (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-destructive/10 border border-destructive/20">
                <Wallet className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Connect your wallet to get started
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            <Card className="bg-gradient-card border-primary/20 hover:scale-105 transition-all">
              <CardHeader>
                <CardTitle className="text-primary">8.5% APY</CardTitle>
                <CardDescription>Current Annual Yield</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Stable returns backed by medical receivables
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent/20 hover:scale-105 transition-all">
              <CardHeader>
                <CardTitle className="text-accent">$2.4M TVL</CardTitle>
                <CardDescription>Total Value Locked</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Growing vault supporting doctors</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-impact/20 hover:scale-105 transition-all">
              <CardHeader>
                <CardTitle className="text-impact">72 Hours</CardTitle>
                <CardDescription>Payment Speed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">From request to doctor payment</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <CardTitle>Deposit SOL</CardTitle>
                </div>
                <CardDescription>
                  Deposit SOL into the vault and start earning yield from medical receivables
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">✓</span>
                    <span>Real-world yield backed by healthcare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">✓</span>
                    <span>On-chain transparency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">✓</span>
                    <span>Withdraw anytime</span>
                  </li>
                </ul>
                <Link href="/deposit">
                  <Button className="w-full" disabled={!connected}>
                    <TrendingUp className="w-4 h-4" />
                    Deposit Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-8 h-8 text-accent" />
                  <CardTitle>Vault Analytics</CardTitle>
                </div>
                <CardDescription>
                  View real-time vault metrics, performance charts, and on-chain data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    <span>Live vault performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    <span>Active receivables tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">✓</span>
                    <span>100% on-chain verification</span>
                  </li>
                </ul>
                <Link href="/vault">
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="w-4 h-4" />
                    View Vault
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
