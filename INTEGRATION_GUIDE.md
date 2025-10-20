# VitalFi Solana Program Integration Guide

## 📊 Integration Status Overview

### ✅ Phase 1: Infrastructure Layer (100% Complete)

The foundational SDK and hooks infrastructure has been successfully integrated into the frontend application using industry best practices for Solana/Anchor development.

**Completed Components:**
- ✅ SDK Layer - Full implementation with proper types
- ✅ Hooks Layer - React Query-based data fetching and mutations
- ✅ Provider Layer - Anchor program and React Query providers
- ✅ Package Published - `@pollum-io/vitalfi-programs@0.1.4` on npm
- ✅ Build System - TypeScript compilation successful
- ✅ Type Safety - Full IDL type integration from published package

### ⏳ Phase 2: Application Integration (0% Complete - Next Phase)

**Pending Tasks:**
- ⏳ Replace mock data with on-chain data in `useFundingVault.ts`
- ⏳ Wire ActionPanel to real deposit transactions
- ⏳ Implement user position tracking in portfolio
- ⏳ Add transaction history/events from chain
- ⏳ Multi-vault support and discovery
- ⏳ Testing on devnet with real vault accounts

---

## 📦 Package Structure

### SDK Layer (`src/lib/vault-sdk/`)
Core SDK for interacting with the on-chain program:

- **`constants.ts`** - Program ID and configuration constants
- **`types.ts`** - TypeScript types from the published IDL package
- **`pdas.ts`** - PDA (Program Derived Address) derivation helpers
- **`fetchers.ts`** - Low-level account fetching utilities with proper typing
- **`client.ts`** - High-level `VaultClient` class for common operations
- **`index.ts`** - Public API exports

**Status**: ✅ Fully implemented and type-safe

### Hooks Layer (`src/lib/vault-hooks/`)
React Query-based hooks for data fetching and mutations:

- **`useVaultClient.ts`** - Get VaultClient instance from program context
- **`useVault.ts`** - Fetch vault account data with caching
- **`usePosition.ts`** - Fetch user position data for connected wallet
- **`useDeposit.ts`** - Deposit mutation with optimistic updates and toast notifications
- **`useClaim.ts`** - Claim mutation with cache invalidation
- **`index.ts`** - Public API exports

**Status**: ✅ Fully implemented with React Query patterns

### Provider Layer (`src/lib/solana/`)
Context providers for program and query management:

- **`provider.tsx`** - `VaultProgramProvider` context providing Anchor program instance
- **`query-provider.tsx`** - `ReactQueryProvider` with optimized defaults
- **`connection.ts`** - Solana connection configuration (existing)

**Status**: ✅ Integrated into app layout

### App Integration (`src/app/layout.tsx`)
Provider hierarchy configured:

```tsx
<ReactQueryProvider>
  <SolanaWalletProvider>
    <VaultProgramProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </VaultProgramProvider>
  </SolanaWalletProvider>
</ReactQueryProvider>
```

**Status**: ✅ Proper provider nesting established

---

## 🎯 Usage Examples

### Fetching Vault Data (Ready to Use)

```typescript
import { useVault } from "@/lib/vault-hooks";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

function VaultDisplay() {
  const authority = new PublicKey("YOUR_VAULT_AUTHORITY");
  const vaultId = new BN(1);

  const { data: vault, isLoading, error } = useVault(authority, vaultId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!vault) return <div>Vault not found</div>;

  return (
    <div>
      <h2>Vault #{vault.vaultId.toString()}</h2>
      <p>Total Deposited: {vault.totalDeposited.toString()}</p>
      <p>Cap: {vault.cap.toString()}</p>
      <p>Status: {Object.keys(vault.status)[0]}</p>
    </div>
  );
}
```

### Fetching User Position (Ready to Use)

```typescript
import { usePosition } from "@/lib/vault-hooks";
import { PublicKey } from "@solana/web3.js";

function UserPosition({ vaultPda }: { vaultPda: PublicKey }) {
  // Automatically uses connected wallet
  const { data: position, isLoading } = usePosition(vaultPda);

  if (isLoading) return <div>Loading position...</div>;
  if (!position) return <div>No position in this vault</div>;

  return (
    <div>
      <p>Your Deposit: {position.deposited.toString()}</p>
      <p>Claimed: {position.claimed.toString()}</p>
      <p>Claimable: {(position.deposited - position.claimed).toString()}</p>
    </div>
  );
}
```

### Depositing into a Vault (Ready to Use)

```typescript
import { useDeposit } from "@/lib/vault-hooks";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

function DepositButton() {
  const deposit = useDeposit();

  const handleDeposit = async () => {
    try {
      await deposit.mutateAsync({
        vaultId: new BN(1),
        authority: new PublicKey("YOUR_VAULT_AUTHORITY"),
        amount: new BN(1_000_000_000), // 1 SOL (9 decimals)
        assetMint: new PublicKey("So11111111111111111111111111111111111111112"), // wSOL
      });
      // Success toast shown automatically
    } catch (error) {
      // Error toast shown automatically
      console.error("Deposit failed:", error);
    }
  };

  return (
    <button onClick={handleDeposit} disabled={deposit.isPending}>
      {deposit.isPending ? "Depositing..." : "Deposit"}
    </button>
  );
}
```

### Claiming from a Vault (Ready to Use)

```typescript
import { useClaim } from "@/lib/vault-hooks";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

function ClaimButton({ vaultId, authority, assetMint }: {
  vaultId: BN;
  authority: PublicKey;
  assetMint: PublicKey;
}) {
  const claim = useClaim();

  const handleClaim = async () => {
    try {
      await claim.mutateAsync({
        vaultId,
        authority,
        assetMint,
      });
      // Success toast shown automatically with tx link
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  return (
    <button onClick={handleClaim} disabled={claim.isPending}>
      {claim.isPending ? "Claiming..." : "Claim"}
    </button>
  );
}
```

### Using VaultClient Directly (Advanced)

```typescript
import { useVaultClient } from "@/lib/vault-hooks";
import { useEffect } from "react";

function MyComponent() {
  const client = useVaultClient();

  useEffect(() => {
    if (!client) return;

    async function loadData() {
      // Fetch vault
      const vault = await client.getVault(authority, vaultId);

      // Get PDAs
      const pdas = client.getPdas(authority, vaultId, userPubkey);

      // Check if vault exists
      const exists = await client.vaultExists(authority, vaultId);

      // Get all vaults by authority
      const vaults = await client.getVaultsByAuthority(authority);
    }

    loadData();
  }, [client]);

  return <div>...</div>;
}
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Components                           │
│  (ActionPanel, VaultInfoCard, PortfolioPage, etc.)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              React Query Hooks Layer                         │
│  useVault(), usePosition(), useDeposit(), useClaim()        │
│  - Automatic caching (30s-2min stale time)                  │
│  - Background refetching                                     │
│  - Optimistic updates                                        │
│  - Error handling with toasts                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 VaultClient (High-level API)                │
│  getVault(), deposit(), claim(), getPosition(), etc.        │
│  - Business logic abstraction                               │
│  - Parameter validation                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        Fetchers / Program Methods (Low-level)               │
│  program.account.vault.fetch(), program.methods.deposit()   │
│  - Direct Anchor program interaction                        │
│  - PDA derivation                                            │
│  - Account deserialization                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Anchor Program (On-chain)                       │
│  VitalFi Vault Program @ 146hbP...YtJNj                     │
│  - Solana BPF bytecode                                       │
│  - State stored in PDAs                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Features & Best Practices Implemented

### Automatic Caching
- ✅ React Query caches all fetched on-chain data
- ✅ Configurable stale times (30s for single queries, 60s for lists, 120s for expensive queries)
- ✅ Automatic background refetching in production
- ✅ Smart cache invalidation after mutations

### Optimistic Updates
- ✅ Deposit mutations invalidate vault and position queries
- ✅ Claim mutations invalidate position and vault queries
- ✅ UI updates immediately after successful transactions
- ✅ Automatic rollback on error

### Error Handling
- ✅ Toast notifications for success/error states
- ✅ Transaction signature links to Solana Explorer
- ✅ Graceful degradation when wallet not connected
- ✅ User-friendly error messages

### Type Safety
- ✅ Full TypeScript support throughout the stack
- ✅ Types generated from program IDL via published package
- ✅ Proper Program<VitalfiVault> typing (not generic Idl)
- ✅ Runtime validation where needed

### Performance
- ✅ Query deduplication (multiple components can use same hook)
- ✅ Stale-while-revalidate pattern
- ✅ Automatic garbage collection of unused cache
- ✅ Disabled window focus refetch in development

---

## 🚀 Next Steps (Phase 2: Application Integration)

### Priority 1: Core Vault Data Integration (Week 1)

**Goal**: Replace mock data with real on-chain data

**Tasks**:

1. **Create vault configuration system** (`src/lib/vault-sdk/config.ts`)
   ```typescript
   // Example structure
   export const VAULT_CONFIG = {
     devnet: {
       authority: new PublicKey("..."),
       vaults: [
         { id: new BN(1), name: "Vault 1", assetMint: wSOL },
       ],
     },
     mainnet: {
       authority: new PublicKey("..."),
       vaults: [...],
     },
   };
   ```

2. **Update `useFundingVault.ts`**
   - Replace `getMockFundingVaultInfo()` with `useVault()` hook
   - Transform on-chain vault account to `VaultFundingInfo` interface
   - Keep existing computed values logic
   - Handle loading/error states properly

3. **Wire ActionPanel to real deposits**
   - Import `useDeposit()` hook
   - Get vault config (authority, vaultId, assetMint)
   - Call `deposit.mutateAsync()` on button click
   - Handle transaction confirmations
   - Disable during pending state

4. **Test on devnet**
   - Deploy test vault on devnet
   - Test deposit flow end-to-end
   - Verify transaction explorer links
   - Test error scenarios

### Priority 2: User Positions & Portfolio (Week 2)

**Goal**: Show real user positions and enable claims

**Tasks**:

1. **Create position display components**
   - Use `usePosition()` hook for current vault
   - Show deposited, claimed, claimable amounts
   - Handle wallet not connected state

2. **Update Portfolio page** (`src/hooks/usePortfolio.ts`)
   - Replace mock data with `useUserPositions()` hook
   - Aggregate positions across all vaults
   - Calculate total deposited, total claimable
   - Show vault status for each position

3. **Implement claim functionality**
   - Add "Claim" button to position cards
   - Use `useClaim()` hook
   - Only show when vault is Matured or Canceled
   - Show transaction confirmations

4. **Add position-specific UI**
   - Expected return calculations (for Active vaults)
   - Claim history
   - Position timeline

### Priority 3: Events & Activity Feed (Week 3)

**Goal**: Real transaction history from chain

**Options** (choose one):

**Option A: RPC-based (Recommended for MVP)**
```typescript
// Use Helius or QuickNode enhanced RPC
async function fetchVaultTransactions(vaultPda: PublicKey) {
  const signatures = await connection.getSignaturesForAddress(vaultPda);
  const txs = await connection.getParsedTransactions(
    signatures.map(s => s.signature)
  );
  return parseDepositEvents(txs);
}
```

**Option B: Anchor Events Listener**
```typescript
// Real-time event subscription
program.addEventListener('depositEvent', (event) => {
  // Handle new deposit
});
```

**Option C: Simple Polling**
```typescript
// Periodically check vault state changes
setInterval(() => {
  queryClient.invalidateQueries(['vault']);
}, 30000);
```

### Priority 4: Multi-Vault Support (Week 4)

**Goal**: Support multiple vaults on the platform

**Tasks**:

1. **Create vault registry/discovery**
   - Use `useVaultsByAuthority()` or `useAllVaults()`
   - Store vault metadata (name, description)
   - Filter by status (Funding, Active, Matured)

2. **Update transparency page**
   - Show list of all vaults
   - Vault cards with stats
   - Link to individual vault pages

3. **Routing improvements**
   - `/vault/[vaultId]` dynamic routes
   - Vault selection UI
   - Deep linking support

---

## 📝 Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta

# Optional
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Program ID

Configured in `src/lib/vault-sdk/constants.ts`:

```typescript
export const VITALFI_VAULT_PROGRAM_ID = new PublicKey(
  "146hbPFqGb9a3v3t1BtkmftNeSNqXzoydzVPk95YtJNj"
);
```

**Note**: This program ID is the same across localnet, devnet, and mainnet.

---

## 🛠️ Development Workflow

### Running the App

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Testing on Localnet

1. **Start local validator** (in programs repo):
   ```bash
   cd ~/Documents/Cambi/vitalfi-programs
   anchor localnet
   ```

2. **Deploy program**:
   ```bash
   anchor build
   anchor deploy --provider.cluster localnet
   ```

3. **Update environment** (in app):
   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=localnet
   NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=http://localhost:8899
   ```

4. **Initialize test vault** (via CLI or admin UI):
   ```bash
   # Example with ts-node
   ts-node scripts/init-vault.ts
   ```

### Testing on Devnet

1. **Ensure devnet program is deployed** (programs repo)
2. **Update environment**:
   ```env
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   ```
3. **Get devnet SOL**: https://solfaucet.com
4. **Test all flows**: deposit, claim, error handling

---

## 📦 Package Management

### When the Program is Updated

1. **Rebuild and generate types** (in programs repo):
   ```bash
   cd ~/Documents/Cambi/vitalfi-programs
   anchor build
   ```

2. **Bump version and republish**:
   ```bash
   npm version patch  # or minor/major
   npm publish --access public
   ```

3. **Update frontend dependency** (in app repo):
   ```bash
   cd ~/Documents/Cambi/vitalfi-app
   npm update @pollum-io/vitalfi-programs
   ```

4. **Verify types are correct**:
   ```bash
   npm run build  # Should compile without errors
   ```

### Current Package Version

- **Published**: `@pollum-io/vitalfi-programs@0.1.4`
- **Includes**: IDL JSON + TypeScript types
- **Exports**:
  - Default: `./target/idl/vitalfi_vault.json`
  - Types: `./target/types/vitalfi_vault.ts`
  - Named: `./idl` and `./types`

---

## 🏗️ Technical Decisions & Rationale

### Why Program<VitalfiVault> instead of Program<Idl>?

Using the specific program type provides:
- ✅ Autocomplete for account names (`program.account.vault.fetch()`)
- ✅ Type-safe instruction building
- ✅ Compile-time validation of account structures
- ✅ Better developer experience

### Why React Query instead of direct state?

React Query provides:
- ✅ Automatic caching and deduplication
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Loading/error states handled
- ✅ Industry standard for data fetching

### Why separate SDK and Hooks layers?

Separation allows:
- ✅ SDK reusable in Node.js scripts, CLIs
- ✅ Hooks specifically for React components
- ✅ Easier testing (SDK can be unit tested)
- ✅ Clear responsibility boundaries

### Why publish package to npm?

Publishing enables:
- ✅ Version control for IDL changes
- ✅ Consistent types across frontend/backend
- ✅ Easy updates when program changes
- ✅ Can be used by external integrators

---

## 📚 Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Program IDL](./node_modules/@pollum-io/vitalfi-programs/target/idl/vitalfi_vault.json)
- [Program Types](./node_modules/@pollum-io/vitalfi-programs/target/types/vitalfi_vault.ts)

---

## ✨ Architecture Benefits

✅ **Separation of Concerns** - SDK, hooks, and UI are cleanly separated
✅ **Type Safety** - Full TypeScript coverage from IDL to UI
✅ **Performance** - React Query optimization and caching
✅ **Maintainability** - Clear structure, easy to extend
✅ **Reusability** - SDK can be used outside React (CLI, scripts, etc.)
✅ **Industry Standard** - Follows patterns from Jupiter, Marinade, Orca
✅ **Developer Experience** - Intuitive API, good error messages
✅ **Testability** - Each layer can be tested independently

---

## 🔍 Troubleshooting

### Build Errors

**Error**: "Cannot find module '@pollum-io/vitalfi-programs'"
- **Fix**: Run `npm install @pollum-io/vitalfi-programs`

**Error**: "Type 'Program<Idl>' is not assignable..."
- **Fix**: Ensure you're importing `VitalfiVault` type from `vault-sdk/types`

**Error**: "Property 'vault' does not exist on type 'AccountNamespace'"
- **Fix**: Use `Program<VitalfiVault>` instead of `Program<Idl>`

### Runtime Errors

**Error**: "Wallet not connected"
- **Fix**: Ensure wallet is connected before calling mutations

**Error**: "Account not found"
- **Fix**: Verify vault exists on the current network (devnet vs mainnet)

**Error**: "Simulation failed"
- **Fix**: Check wallet has sufficient SOL for transaction + rent

### Integration Issues

**Issue**: Hooks return null
- **Check**: Is `VaultProgramProvider` in the component tree?
- **Check**: Is wallet connected?
- **Check**: Are authority/vaultId parameters correct?

**Issue**: Mutations don't update UI
- **Check**: Are query keys matching between hooks?
- **Check**: Is cache invalidation happening in `onSuccess`?

---

## 📊 Current File Structure

```
vitalfi-app/
├── src/
│   ├── lib/
│   │   ├── vault-sdk/          ✅ SDK Layer (Complete)
│   │   │   ├── client.ts
│   │   │   ├── constants.ts
│   │   │   ├── fetchers.ts
│   │   │   ├── index.ts
│   │   │   ├── pdas.ts
│   │   │   └── types.ts
│   │   ├── vault-hooks/        ✅ Hooks Layer (Complete)
│   │   │   ├── index.ts
│   │   │   ├── useClaim.ts
│   │   │   ├── useDeposit.ts
│   │   │   ├── usePosition.ts
│   │   │   ├── useVault.ts
│   │   │   └── useVaultClient.ts
│   │   └── solana/             ✅ Provider Layer (Complete)
│   │       ├── provider.tsx
│   │       └── query-provider.tsx
│   ├── hooks/                  ⏳ Needs Integration
│   │   ├── useFundingVault.ts  ← Replace mock data
│   │   └── usePortfolio.ts     ← Replace mock data
│   ├── components/
│   │   └── vault/              ⏳ Needs Wiring
│   │       └── ActionPanel.tsx ← Wire deposit hook
│   └── app/
│       └── layout.tsx          ✅ Providers configured
├── package.json                ✅ Dependencies added
├── tsconfig.json               ✅ ES2020 for BigInt
└── INTEGRATION_GUIDE.md        ✅ This file
```

---

**Last Updated**: October 20, 2025
**SDK Version**: `@pollum-io/vitalfi-programs@0.1.4`
**Status**: Infrastructure Complete, Application Integration In Progress
