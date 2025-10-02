"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Home, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export function Header() {
  const navLinks = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Deposit", href: "/deposit", icon: TrendingUp },
    { name: "Withdraw", href: "/withdraw", icon: TrendingDown },
    { name: "Vault", href: "/vault", icon: BarChart3 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="VitalFi Logo"
                width={40}
                height={40}
                className="transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VitalFi
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all rounded-lg hover:bg-primary/5 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
