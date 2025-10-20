import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/contexts/WalletProvider";
import { VaultProgramProvider } from "@/lib/solana/provider";
import { ReactQueryProvider } from "@/lib/solana/query-provider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "VitalFi - Solana Healthcare Vault",
  description: "Earn yield while empowering healthcare providers through DeFi-powered medical receivable financing on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased pb-16 lg:pb-0`} suppressHydrationWarning>
        <ReactQueryProvider>
          <SolanaWalletProvider>
            <VaultProgramProvider>
              <SidebarProvider>
                {children}
                <MobileNav />
                <Toaster position="bottom-right" theme="dark" />
              </SidebarProvider>
            </VaultProgramProvider>
          </SolanaWalletProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
