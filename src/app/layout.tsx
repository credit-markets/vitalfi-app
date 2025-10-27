import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/providers/WalletProvider";
import { VaultProgramProvider } from "@/lib/solana/provider";
import { ReactQueryProvider } from "@/providers/query-provider";
import { SidebarProvider } from "@/providers/SidebarContext";
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
                <Toaster
                  position="bottom-right"
                  theme="dark"
                  richColors
                  closeButton
                  duration={5000}
                  toastOptions={{
                    style: {
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    },
                    className: 'font-sans',
                  }}
                />
              </SidebarProvider>
            </VaultProgramProvider>
          </SolanaWalletProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
