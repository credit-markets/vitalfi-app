"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, User, ChevronLeft, ChevronRight, ExternalLink, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();

  const navLinks = [
    { name: "Vaults", href: "/", icon: BarChart3 },
    { name: "Portfolio", href: "/portfolio", icon: User },
  ];

  const externalLinks = [
    { name: "Privacy Policy", href: "https://vitalfi.io/privacy", icon: Shield },
    { name: "Terms of Service", href: "https://vitalfi.io/terms", icon: FileText },
    { name: "Docs", href: "https://docs.vitalfi.io", icon: FileText },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:fixed left-0 top-20 bottom-0 bg-background/95 backdrop-blur-xl border-r border-primary/20 transition-all duration-300 z-40 lg:block",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="relative h-full flex flex-col">
        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-background border border-primary/20 rounded-full p-1 hover:bg-primary/10 transition-colors z-10"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-primary" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-2 mt-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-all",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                  isCollapsed ? "justify-center px-3 py-3" : "px-4 py-3"
                )}
                title={isCollapsed ? link.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{link.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* External Links */}
        {!isCollapsed && (
          <div className="p-4 space-y-2 border-t border-border/30">
            <div className="text-center space-y-1.5">
              {externalLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  <span>{link.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
