"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet/WalletButton";
import { BarChart3, User, Eye, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Vault", href: "/", icon: BarChart3 },
    { name: "Portfolio", href: "/portfolio", icon: User },
    { name: "Transparency", href: "/transparency", icon: Eye },
  ];

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

            {/* Mobile Menu Button - Larger touch target */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-lg hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-primary" />
              )}
            </button>
          </div>

          {/* Wallet Button */}
          <WalletButton />
        </div>

        {/* Mobile Navigation - Improved touch targets */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-20 bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-lg">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-lg transition-all touch-manipulation",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary active:bg-primary/5"
                    )}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span className="text-base font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
