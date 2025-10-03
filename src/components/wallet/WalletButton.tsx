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
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" className="font-mono text-xs sm:text-sm h-9 sm:h-9 px-2 sm:px-3 touch-manipulation">
          <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">{shortenAddress(publicKey.toBase58())}</span>
          <span className="xs:hidden">{shortenAddress(publicKey.toBase58(), 3)}</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={disconnect} className="h-9 w-9 touch-manipulation">
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => setVisible(true)} size="sm" className="text-xs sm:text-sm h-9 sm:h-9 px-3 sm:px-4 touch-manipulation">
      <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
      <span className="hidden xs:inline">Connect Wallet</span>
      <span className="xs:hidden">Connect</span>
    </Button>
  );
}
