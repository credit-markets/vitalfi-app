"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="VitalFi Logo"
                  width={32}
                  height={32}
                  className="transition-transform group-hover:scale-110 sm:w-10 sm:h-10"
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
