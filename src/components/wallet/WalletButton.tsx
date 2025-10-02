"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="font-mono">
          <Wallet className="w-4 h-4" />
          {shortenAddress(publicKey.toBase58())}
        </Button>
        <Button variant="ghost" size="icon" onClick={disconnect}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => setVisible(true)} size="sm">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
