# VitalFi - Solana Healthcare Vault Application

A Next.js application for depositing SOL into a transparent DeFi vault that finances medical receivables in Brazil, helping doctors get paid faster while generating yield for depositors.

## 🚀 Features

- **Solana Wallet Integration** - Connect with Phantom, Solflare, and other Solana wallets
- **Real-time Vault Metrics** - View TVL, APY, share redemption value, and vault performance
- **Deposit/Withdraw** - Seamless SOL deposits and share redemption with 90-day lockup
- **Portfolio Tracking** - View your share balance, locked/unlocked lots, and transaction history
- **Transparency Dashboard** - Full on-chain verification with event-driven derivations
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
│   │   ├── derive.ts            # Event-driven derivation logic (PPS, APY)
│   │   └── utils.ts             # Utility functions
│   ├── contexts/
│   │   ├── WalletProvider.tsx   # Solana wallet context
│   │   └── SidebarContext.tsx   # Sidebar state management
│   ├── hooks/                   # Custom React hooks
│   │   ├── useVaultTx.ts        # Vault transaction functions
│   │   └── useTransparency.ts   # Transparency data hook
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

### Single-Token Vault Model

The vault operates on a single share token model with the following mechanics:

- **Deposits**: Users deposit SOL and receive vault shares (90-day lockup period)
- **Redemption**: Users redeem unlocked shares for SOL at current share price (1.02x principal)
- **Yield**: Vault generates ~8.5% APY from medical receivables financing
- **Withdrawal Queue**: Locked shares can be queued for early withdrawal (2-day processing)

### Event-Driven Derivations

All vault metrics (Price Per Share, APY) are computed from an immutable event stream:

- **Deposit Events**: Add assets and shares
- **Claim Events**: Remove assets and shares
- **Repayment Events**: Add assets only (increases PPS)

The `/transparency` page provides full on-chain verification with reproducible calculations.

### Pages

1. **Vault Dashboard** (`/`) - Main page with vault overview, analytics, and deposit/withdraw actions
2. **Portfolio** (`/portfolio`) - User-specific positions, locked/unlocked lots, and transaction history
3. **Transparency** (`/transparency`) - On-chain accounts, parameters, event inspector, and verification tools

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Development Notes

- **Mock Data**: Currently using mock data in `src/lib/solana/mock-data.ts` for development
- **Devnet First**: Always test on Solana devnet before mainnet deployment
- **Event-Driven**: All vault metrics derive from the event stream (see `src/lib/derive.ts`)
- **Type Safety**: Comprehensive TypeScript types in `src/types/vault.ts`

### Solana Development

Test on devnet:
1. Get devnet SOL from [solfaucet.com](https://solfaucet.com)
2. Configure wallet to use devnet
3. Test all transactions before mainnet deployment

## 📄 License

TBD.

## 🔗 Links

- [Landing Page](../vitalfi-health-yield)
- [Solana Docs](https://docs.solana.com)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Next.js Docs](https://nextjs.org/docs)
