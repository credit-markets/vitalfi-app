/**
 * Jupiter Swap Modal - Redesigned
 * Professional design aligned with VitalFi design system
 */

"use client";

import { useState, useMemo } from "react";
import { X, ArrowDown, AlertCircle, Info, Zap, ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useJupiterQuote } from "@/hooks/jupiter/use-jupiter-quote";
import { useJupiterSwap } from "@/hooks/jupiter/use-jupiter-swap";
import { useTokenBalance } from "@/hooks/wallet/use-token-balance";
import { useTokenSearch } from "@/hooks/jupiter/use-token-list";
import { POPULAR_TOKENS, USDT_MAINNET, isUSDT } from "@/lib/jupiter/tokens";
import { formatCompactNumber } from "@/lib/utils/formatters";
import { env } from "@/lib/env";
import type { JupiterToken } from "@/lib/jupiter/types";

// Format numbers with decimal places
function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwapSuccess?: (outputAmount: number) => void;
}

export function SwapModal({ isOpen, onClose, onSwapSuccess }: SwapModalProps) {
  const [selectedToken, setSelectedToken] = useState<JupiterToken>(
    POPULAR_TOKENS[0]
  );
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [showTokenPicker, setShowTokenPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { swap, isSwapping } = useJupiterSwap();
  const { data: tokenBalance = 0 } = useTokenBalance(selectedToken.address);

  // Always use mainnet API for quotes (works on both devnet and mainnet)
  const isMainnet = env.solanaNetwork === "mainnet-beta";
  const amountNum = parseFloat(amount) || 0;

  // Calculate base units for Jupiter API
  const amountInBaseUnits = useMemo(() => {
    if (amountNum <= 0 || isNaN(amountNum)) return "0";
    try {
      const decimals = selectedToken.decimals;
      const multiplier = Math.pow(10, decimals);
      const baseUnits = Math.floor(amountNum * multiplier);

      // Ensure we have a valid number
      if (baseUnits <= 0 || !isFinite(baseUnits)) return "0";

      return baseUnits.toString();
    } catch (error) {
      console.error('Amount calculation error:', error);
      return "0";
    }
  }, [amountNum, selectedToken.decimals]);

  const { quote, preview, isLoading: isLoadingQuote } = useJupiterQuote(
    {
      inputMint: selectedToken.address,
      outputMint: USDT_MAINNET.address,
      amount: amountInBaseUnits,
      slippageBps,
      enabled: amountNum > 0 && !isUSDT(selectedToken.address),
    },
    selectedToken,
    USDT_MAINNET
  );

  // Token search results
  const { results: searchResults, isLoading: isSearching } = useTokenSearch(searchQuery);

  // Filter out USDT from results
  const filteredTokens = useMemo(() => {
    return searchResults.filter((t) => !isUSDT(t.address));
  }, [searchResults]);

  const canSwap =
    isMainnet && amountNum > 0 && !!quote && amountNum <= tokenBalance;

  const handleSwap = async () => {
    if (!canSwap || !quote || !preview) return;

    try {
      const result = await swap({
        quote,
        inputAmount: amountNum,
        outputAmount: preview.outputAmount,
        inputSymbol: selectedToken.symbol,
        outputSymbol: USDT_MAINNET.symbol,
      });

      onSwapSuccess?.(result.outputAmount);
      onClose();
      setAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  const handleSelectToken = (token: JupiterToken) => {
    setSelectedToken(token);
    setShowTokenPicker(false);
    setSearchQuery("");
    setAmount("");
  };

  if (!isOpen) return null;

  const priceImpactHigh = (preview?.priceImpact || 0) > 1;
  const priceImpactVeryHigh = (preview?.priceImpact || 0) > 5;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md p-6 relative bg-gradient-card border-border/50 shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 shadow-glow-primary">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Convert to USDT</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5 hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Devnet Notice */}
          {!isMainnet && (
            <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-2.5">
              <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Preview mode: Quotes are live from mainnet, but swaps are disabled
                on devnet.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* From Token Section - Fixed Height */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                You pay
              </label>
              <div className="relative">
                <div className="p-4 bg-muted/20 border border-border rounded-lg hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    {/* Token Selector */}
                    <button
                      onClick={() => setShowTokenPicker(!showTokenPicker)}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-background/50 hover:bg-background rounded-lg transition-colors group flex-shrink-0"
                    >
                      {selectedToken.logoURI ? (
                        <Image
                          src={selectedToken.logoURI}
                          alt={selectedToken.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {selectedToken.symbol.slice(0, 2)}
                        </div>
                      )}
                      <span className="font-semibold text-sm">{selectedToken.symbol}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all ${
                          showTokenPicker ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Amount Input */}
                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow numbers and decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setAmount(value);
                          }
                        }}
                        className="text-right text-2xl font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto w-full"
                      />
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setAmount(tokenBalance.toString())}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Balance: {formatCompactNumber(tokenBalance)}
                    </button>
                  </div>
                </div>

                {/* Token Picker Dropdown - Absolute positioned overlay */}
                {showTokenPicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-2xl z-10 max-h-[400px] overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search tokens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                        autoFocus
                      />
                    </div>

                    {/* Popular Tokens Label */}
                    {!searchQuery && (
                      <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                        Popular Tokens
                      </div>
                    )}

                    {/* Token List - Scrollable */}
                    <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-1">
                      {isSearching ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          Searching...
                        </div>
                      ) : filteredTokens.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No tokens found
                        </div>
                      ) : (
                        filteredTokens.slice(0, 50).map((token) => (
                          <button
                            key={token.address}
                            onClick={() => handleSelectToken(token)}
                            className="w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2.5 text-left group"
                          >
                            {token.logoURI ? (
                              <Image
                                src={token.logoURI}
                                alt={token.symbol}
                                width={28}
                                height={28}
                                className="rounded-full flex-shrink-0"
                                unoptimized
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {token.symbol.slice(0, 2)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                                {token.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {token.name}
                              </div>
                            </div>
                            {token.tags?.includes("verified") && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-2 text-[10px] flex-shrink-0"
                              >
                                ✓
                              </Badge>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow Separator */}
            <div className="flex justify-center -my-2 relative z-0">
              <div className="p-2 rounded-full bg-muted border border-border">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* To Token Section (USDT) */}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                You receive
              </label>
              <div className="p-4 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  {/* USDT Token Display */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-background/50 rounded-lg flex-shrink-0">
                    {USDT_MAINNET.logoURI && (
                      <Image
                        src={USDT_MAINNET.logoURI}
                        alt="USDT"
                        width={24}
                        height={24}
                        className="rounded-full"
                        unoptimized
                      />
                    )}
                    <span className="font-semibold text-sm">USDT</span>
                  </div>

                  {/* Output Amount */}
                  <div className="text-right flex-1">
                    <div className="text-2xl font-bold text-primary">
                      {preview?.outputAmount
                        ? formatNumber(preview.outputAmount, 2)
                        : "0.00"}
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingQuote && amountNum > 0 && (
                  <div className="flex justify-end mt-2">
                    <div className="text-xs text-muted-foreground">
                      Fetching quote...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Details */}
            {preview && (
              <Card className="p-4 bg-muted/30 border-muted">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Swap Details</span>
                  <div className="flex items-center gap-2">
                    {[10, 50, 100].map((bps) => (
                      <button
                        key={bps}
                        onClick={() => setSlippageBps(bps)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          slippageBps === bps
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/70 text-muted-foreground"
                        }`}
                      >
                        {bps / 100}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">
                      1 {selectedToken.symbol} ≈{" "}
                      {formatNumber(preview.outputAmount / preview.inputAmount, 4)}{" "}
                      USDT
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Impact</span>
                    <span
                      className={`font-medium ${
                        priceImpactVeryHigh
                          ? "text-destructive"
                          : priceImpactHigh
                          ? "text-[hsl(var(--impact))]"
                          : "text-green-500"
                      }`}
                    >
                      {preview.priceImpact.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Received</span>
                    <span className="font-medium">
                      {formatNumber(preview.minimumReceived, 4)} USDT
                    </span>
                  </div>

                  {preview.route.length > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Route</span>
                      <div className="flex gap-1">
                        {preview.route.slice(0, 3).map((dex, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {dex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Impact Warning */}
                {priceImpactHigh && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg flex items-start gap-2 text-xs ${
                      priceImpactVeryHigh
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-[hsl(var(--impact))]/10 text-[hsl(var(--impact))] border border-[hsl(var(--impact))]/20"
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">
                      {priceImpactVeryHigh
                        ? "Very high price impact! Consider reducing amount."
                        : "High price impact. Review before confirming."}
                    </span>
                  </div>
                )}
              </Card>
            )}

            {/* Swap Button */}
            <Button
              className="w-full shadow-glow-primary"
              size="lg"
              disabled={!canSwap || isSwapping || isLoadingQuote || !isMainnet}
              onClick={handleSwap}
            >
              {!isMainnet
                ? "Swap (Mainnet Only)"
                : isSwapping
                ? "Swapping..."
                : isLoadingQuote
                ? "Loading quote..."
                : amountNum === 0
                ? "Enter amount"
                : amountNum > tokenBalance
                ? "Insufficient balance"
                : `Swap ${selectedToken.symbol} to USDT`}
            </Button>

            {/* Help Text */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Powered by Jupiter aggregator. Your {selectedToken.symbol} will be
                swapped to USDT at the best available rate across Solana DEXs.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
