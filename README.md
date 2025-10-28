# VitalFi App

**DeFi app for healthcare financing - Earn Yield. Empower Healthcare.**

Built by Credit Markets | Part of the VitalFi ecosystem

Next.js application enabling liquidity providers to earn up to 16% APY backed by institutional-grade Brazilian medical receivables. Deposit USDT into transparent vaults, track portfolio performance, and access full collateral transparency.

## 🚀 Features

- **Solana Wallet Integration** - Connect with Phantom, Solflare, and other Solana wallets
- **Fixed-Yield Funding Vaults** - Deposit SOL during funding phase with locked capital until maturity
- **Real-time Vault Metrics** - View TVL, expected APY, funding progress, and timeline
- **Portfolio Tracking** - Monitor positions across multiple vaults with expected returns
- **Transparency Dashboard** - Full receivables transparency with collateral analytics, hedge positions, and documents
- **Beautiful UI** - Dark theme with purple/cyan gradient design system
- **Responsive Design** - Works on desktop, tablet, and mobile with collapsible sidebar

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Blockchain**: Solana Web3.js
- **Wallet Adapter**: @solana/wallet-adapter-react
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Notifications**: Sonner

## 📁 Project Structure

```
vitalfi-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Vault dashboard (main page)
│   │   ├── portfolio/           # Portfolio page with user positions
│   │   └── transparency/        # Transparency page with on-chain verification
│   ├── components/
│   │   ├── ui/                  # UI primitives (Button, Card, Input, etc.)
│   │   ├── wallet/              # Wallet connection components
│   │   ├── vault/               # Vault components (Header, Analytics, ActionCard, ActivityFeed)
│   │   ├── transparency/        # Transparency components (Accounts, Charts, Events, etc.)
│   │   └── layout/              # Layout components (Header, Sidebar)
│   ├── lib/
│   │   ├── solana/              # Solana integration and mock data
│   │   ├── transparency/        # Transparency API and mock data
│   │   └── utils.ts             # Utility functions
│   ├── contexts/
│   │   ├── WalletProvider.tsx   # Solana wallet context
│   │   └── SidebarContext.tsx   # Sidebar state management
│   ├── hooks/                   # Custom React hooks
│   │   ├── useFundingVault.ts   # Funding vault data hook
│   │   └── usePortfolio.ts      # Portfolio data hook
│   └── types/
│       └── vault.ts             # Vault type definitions
├── public/
│   └── logo.png                 # VitalFi logo
└── .env.local                   # Environment variables
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, pnpm, or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd vitalfi-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

4. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎨 Design System

The design system is ported from the VitalFi landing page:

### Colors
- **Primary (Purple)**: `hsl(263 70% 60%)` / `#7A5CD6`
- **Secondary/Accent (Cyan)**: `hsl(180 100% 50%)` / `#00FFFF`
- **Background**: `hsl(240 10% 3.9%)`
- **Impact (Orange)**: `hsl(25 95% 53%)`

### Key Features
- Custom gradient backgrounds (`bg-gradient-hero`, `bg-gradient-card`)
- Glow effects (`shadow-glow-primary`, `shadow-glow-secondary`)
- Animations (`animate-fade-in`, `animate-glow-pulse`)
- Hover scale effects on interactive elements

## 🔌 Solana Integration

### Network Configuration

The app supports both devnet and mainnet. Configure via environment variables:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Wallet Adapters

Currently integrated wallets:
- Phantom
- Solflare

## 🏗️ Architecture

### Fixed-Yield Funding Model

The vault operates on a **fixed-yield funding model** with the following mechanics:

- **Funding Phase**: Users deposit SOL during the funding period (limited capacity)
- **Locked Capital**: All deposits are locked until vault maturity date
- **Fixed APY**: Expected annual percentage yield (e.g., 12% APY) set at funding
- **Maturity**: At maturity, users claim principal + accrued yield
- **Collateral**: Vault finances medical receivables in Brazil with full transparency

### Transparency & Reporting

The `/transparency` page provides comprehensive vault reporting:

- **Vault Facts**: Key metrics, stage, timeline, and originator information
- **Collateral Analytics**: Receivables table with face value, advance rates, maturity dates
- **Hedge Positions**: Currency hedging details (NDF, forwards, etc.)
- **Documents**: Access to legal docs, audit reports, and receivable assignments

### Pages

1. **Vault Dashboard** (`/`) - Main funding vault page with KPIs, overview, and participation panel
2. **Portfolio** (`/portfolio`) - User positions across all vaults with expected returns and timeline
3. **Transparency** (`/transparency`) - Vault selection hub
4. **Transparency Detail** (`/transparency/[vaultId]`) - Full receivables transparency for specific vault

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Development Notes

- **Mock Data**: Currently using mock data in `src/lib/solana/mock-data.ts` and `src/lib/transparency/mock.ts` for development
- **Devnet First**: Always test on Solana devnet before mainnet deployment
- **Type Safety**: Comprehensive TypeScript types in `src/types/vault.ts`
- **Funding Model**: Fixed-yield vaults with locked capital until maturity (no early withdrawals)

### Solana Development

Test on devnet:
1. Get devnet SOL from [solfaucet.com](https://solfaucet.com)
2. Configure wallet to use devnet
3. Test all transactions before mainnet deployment

## 📄 License

MIT

## 🔗 Links

- **Live App:** https://app.vitalfi.lat
- **Landing Page:** https://vitalfi.lat
- **Documentation:** https://docs.vitalfi.lat
- **VitalFi Program:** https://github.com/credit-markets/vitalfi-programs
- **Backend API:** https://github.com/credit-markets/vitalfi-backend
- [Solana Docs](https://docs.solana.com)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Next.js Docs](https://nextjs.org/docs)

---

**Powered by Credit Markets | Built on Solana**

_Earn Yield. Empower Healthcare._
