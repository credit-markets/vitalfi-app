"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation bar
 * Fixed at bottom on mobile screens (< lg breakpoint)
 * Hidden on desktop (>= lg breakpoint)
 */
export function MobileNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Vaults", href: "/", icon: BarChart3 },
    { name: "Portfolio", href: "/portfolio", icon: User },
    { name: "Admin", href: "/admin", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-primary/20 safe-area-inset-bottom">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative grid grid-cols-3 gap-1 px-2 py-2 pb-safe">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg transition-all touch-manipulation",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:bg-primary/5"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
