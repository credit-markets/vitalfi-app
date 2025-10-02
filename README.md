# VitalFi - Solana Healthcare Vault Application

A Next.js application for depositing SOL into a transparent DeFi vault that finances medical receivables in Brazil, helping doctors get paid faster while generating yield for depositors.

## 🚀 Features

- **Solana Wallet Integration** - Connect with Phantom, Solflare, and other Solana wallets
- **Real-time Vault Metrics** - View TVL, APY, and vault performance
- **Deposit/Withdraw** - Seamless SOL deposits and withdrawals
- **Beautiful UI** - Dark theme with purple/cyan gradient design system matching the landing page
- **Responsive Design** - Works on desktop, tablet, and mobile

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
│   │   ├── page.tsx             # Dashboard home
│   │   ├── deposit/             # Deposit flow (TODO)
│   │   ├── withdraw/            # Withdraw flow (TODO)
│   │   └── vault/               # Vault analytics (TODO)
│   ├── components/
│   │   ├── ui/                  # UI components (Button, Card)
│   │   ├── wallet/              # Wallet components
│   │   ├── vault/               # Vault components (TODO)
│   │   └── layout/              # Layout components (Header)
│   ├── lib/
│   │   ├── solana/              # Solana integration
│   │   │   └── connection.ts    # RPC connection setup
│   │   ├── hooks/               # Custom hooks (TODO)
│   │   └── utils.ts             # Utility functions
│   ├── contexts/
│   │   └── WalletProvider.tsx   # Solana wallet context
│   └── types/                   # TypeScript types (TODO)
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

## 📝 TODO

### Pages to Build
- [x] Dashboard/Home page
- [ ] Deposit page with form and transaction flow
- [ ] Withdraw page with balance display
- [ ] Vault analytics page with charts
- [ ] Transaction history

### Components to Build
- [x] Button, Card (UI primitives)
- [x] WalletButton
- [x] Header with navigation
- [ ] Input components (for amounts)
- [ ] Transaction status modal
- [ ] Vault stats cards
- [ ] Charts (TVL over time, APY history)
- [ ] Transaction history list

### Features to Implement
- [ ] Solana program integration (vault program)
- [ ] Deposit SOL transaction
- [ ] Withdraw vault tokens transaction
- [ ] Real-time balance fetching
- [ ] Transaction history from blockchain
- [ ] Error handling and user feedback
- [ ] Loading states
- [ ] Form validation
- [ ] Mobile responsive menu

### Future Enhancements
- [ ] React Query for data fetching/caching
- [ ] Wallet balance auto-refresh
- [ ] Transaction notifications
- [ ] Dark/light mode toggle
- [ ] Multi-language support
- [ ] Analytics integration

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Components

Follow the shadcn/ui pattern:

```bash
# Create component in src/components/ui/
# Example: src/components/ui/input.tsx
```

### Solana Development

Test on devnet first:
1. Get devnet SOL from [solfaucet.com](https://solfaucet.com)
2. Configure wallet to use devnet
3. Test all transactions before mainnet

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on devnet
4. Submit a pull request

## 📄 License

TBD

## 🔗 Links

- [Landing Page](../vitalfi-health-yield)
- [Solana Docs](https://docs.solana.com)
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Next.js Docs](https://nextjs.org/docs)
