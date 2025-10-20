# VitalFi Phase 3: Mainnet Hardening Plan

**Version**: 1.0
**Date**: October 20, 2025
**Status**: Ready for Implementation
**Package Version**: `@pollum-io/vitalfi-programs@0.1.4` (verified in package.json line 14)

---

## Executive Summary

VitalFi has completed **Phase 2 (Application Integration)** at 97.5%. All mock data replaced with real on-chain calls, deposit/claim transactions working, portfolio tracking live. **Phase 3** focuses on production hardening for mainnet: real-time subscriptions (90% RPC savings), batched reads, priority fees, finalized reconciliation, Sentry observability, and test coverage. **No backwards compatibility required**—we simplify invalidations, lock commitment policies, and adopt scalable patterns. Timeline: 4-6 weeks.

---

## Current State (Verified)

### ✅ What Exists in Code Today

**SDK Layer** (`src/lib/vault-sdk/`):
- `client.ts:31-332` - VaultClient with deposit/claim/init methods
- `fetchers.ts:22-196` - Account fetching with hardcoded offsets (L74: `offset: 8 + 2`, L149: `offset: 8 + 32`)
- `pdas.ts` - PDA derivation helpers
- `types.ts:1-51` - IDL imports from `@pollum-io/vitalfi-programs@0.1.4`
- `config.ts:34-119` - Vault configurations by network

**Hooks Layer** (`src/lib/vault-hooks/`):
- `useVault.ts:28-115` - React Query vault fetching, 30s staleTime, polling-based
- `usePosition.ts:29-86` - Position fetching, 20s staleTime
- `useDeposit.ts:33-85` - Mutation with broad invalidations (L52-60: invalidates all "position" and "user-positions")
- `useClaim.ts` - Claim mutation (similar pattern)

**Provider Layer** (`src/lib/solana/`):
- `connection.ts:1-14` - Simple Connection, `DEFAULT_COMMITMENT: "confirmed"` (L7)
- `provider.tsx:1-67` - VaultProgramProvider with Anchor Program<VitalfiVault>
- `query-provider.tsx` - React Query setup

**Error Tracking**:
- `error-tracking.ts:1-51` - Stub with TODO for Sentry (L21: `// TODO: Send to error tracking service`)

**Transactions**:
- Current flow: deposit/claim → confirmed commitment → toast → invalidate queries
- No priority fees, no finalized reconciliation, no min context slot tracking

**CI/CD**:
- `.github/workflows/claude-code-review.yml` - Claude review workflow only
- No build/test/lint CI pipeline

**Tests**:
- None in `src/` (verified: no `*.test.ts` files)
- No `vitest.config.ts`

### 📊 Account Structure (From IDL)

**Vault Account** (8 discriminator + fields):
```
u16 version             2 bytes
pubkey authority       32 bytes
u64 vault_id            8 bytes
pubkey asset_mint      32 bytes
pubkey vault_token     32 bytes
u64 cap                 8 bytes
u32 target_apy_bps      4 bytes
i64 funding_end_ts      8 bytes
i64 maturity_ts         8 bytes
u64 min_deposit         8 bytes
VaultStatus status      1 byte (enum)
u64 total_deposited     8 bytes
u64 total_claimed       8 bytes
u128 payout_num        16 bytes
u128 payout_den        16 bytes
u8 bump                 1 byte
= 8 + 184 = 192 bytes
```

**Position Account** (8 discriminator + fields):
```
pubkey vault           32 bytes
pubkey owner           32 bytes
u64 deposited           8 bytes
u64 claimed             8 bytes
u8 bump                 1 byte
= 8 + 81 = 89 bytes
```

---

## Gaps vs. Best Practices (Verified)

1. **No Real-time Subscriptions** (fetchers.ts uses `.fetch()`, hooks use polling)
   - **Why it matters**: 2 RPC calls/min × 100 users = 12,000 calls/hour; subscriptions → ~100 connections

2. **No Batched Reads** (fetchers.ts L29, L50, L125: single `.fetch()` calls)
   - **Why it matters**: List views with 10 vaults = 10 separate RPC calls; batching → 1 call

3. **Hardcoded Offsets** (fetchers.ts L74: `offset: 8 + 2`, L149: `offset: 8 + 32`)
   - **Why it matters**: Fragile, no compile-time validation, breaks on IDL changes

4. **Broad Invalidations** (useDeposit.ts L52-60: invalidates all "position" queries)
   - **Why it matters**: Over-refetches unrelated data, wastes RPC calls

5. **No Finalized Reconciliation** (connection.ts L7: `confirmed` only)
   - **Why it matters**: Reorgs can cause incorrect cache state

6. **No Priority Fees** (client.ts deposit/claim: no ComputeBudget instructions)
   - **Why it matters**: Mainnet congestion → failed transactions or 60s+ landing times

7. **Raw Error Messages** (useDeposit.ts L78: `error.message` passed to toast)
   - **Why it matters**: "custom program error: 0x1771" is useless to users

8. **No Retry Logic** (connection.ts: no retry wrapper)
   - **Why it matters**: Transient RPC failures → poor UX

9. **No Tests** (verified: no src/**/*.test.ts files)
   - **Why it matters**: Layout offsets, reconcile logic, filter generation untested

10. **No Production Observability** (error-tracking.ts L21: Sentry TODO)
    - **Why it matters**: Impossible to debug mainnet issues

---

## Decisions & Simplifications

### Removed / Avoided

1. **No backwards compatibility** for hook signatures—narrow query keys immediately
2. **No legacy polling fallback**—subscriptions are primary, polling only for initial fetch
3. **No Next.js API routes**—frontend-only architecture, no `/api/*` directory
4. **No database/indexer**—RPC-based activity feed sufficient for MVP
5. **Drop broad invalidations**—replace `queryKey: ["position"]` with specific keys like `["position", vaultPda, user]`

### Locked Policies

1. **Commitment**: Reads at `confirmed`, reconcile to `finalized` after mutations
2. **RPC**: Require paid endpoint in prod via env validation (error if missing)
3. **Query Keys**: Narrow scope—`["vault", authority, vaultId]` not `["vault"]`
4. **Account Layouts**: Single source of truth in `layout.ts`, test-enforced
5. **Priority Fees**: Optional via `NEXT_PUBLIC_PRIORITY_FEE_MICROS`, default 5000 microlamports

---

## Architecture Spec (Simple & Scalable)

### Real-time Updates

**Pattern**: PDA subscriptions under React Query, no backend needed

```typescript
// New: src/lib/solana/subscriptions.ts
onPdaChange(connection, pda, decode, onUpdate) {
  subscriptionId = connection.onAccountChange(pda, (accountInfo) => {
    onUpdate(decode(accountInfo));
  }, { commitment: "confirmed" });
  return () => connection.removeAccountChangeListener(subscriptionId);
}

// Updated: src/lib/vault-hooks/useVault.ts
useEffect(() => {
  const unsubscribe = onPdaChange(connection, vaultPda, decode, (data) => {
    // Hash compare before setQueryData to prevent unnecessary re-renders
    queryClient.setQueryData(queryKey, (old) =>
      JSON.stringify(old) === JSON.stringify(data) ? old : data
    );
  });
  return unsubscribe;
}, [vaultPda]);
```

**Guardrail**: Hash compare before cache updates, unsubscribe on unmount

### Batched Reads

**Pattern**: `getMultipleAccountsInfo` + strict filters from centralized layout

```typescript
// New: src/lib/vault-sdk/batch.ts
async function fetchMultipleVaults(connection, authority) {
  const filters = vaultFilters(authority);
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });
  return accounts.map(decode);
}

// Filters use layout.ts constants
const filters = [
  { dataSize: VaultLayout.dataSize },
  { memcmp: { offset: VaultLayout.authorityOffset, bytes: authority.toBase58() } }
];
```

**Guardrail**: `dataSize` tests must pass before deploy, fail on placeholder values

### Transaction Reliability

**Pattern**: Priority fees + minContextSlot + confirmed→finalized reconcile

```typescript
// New: src/lib/vault-sdk/tx.ts
function withPriorityFee(instructions, microLamports = 5000) {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ...instructions
  ];
}

// Updated: useDeposit.ts
const { context } = await connection.getLatestBlockhashAndContext();
const txSig = await client.deposit(...); // Uses priority fees internally
await connection.confirmTransaction(txSig, "confirmed"); // Fast UX
reconcileFinalized(connection, [vaultPda, positionPda], decode, onChange); // Background
```

**Guardrail**: Reconcile only updates cache if finalized data differs (hash compare)

### Observability

**Pattern**: Sentry for prod, structured toasts, safe logging

```typescript
// Updated: src/lib/error-tracking.ts
if (process.env.NEXT_PUBLIC_SENTRY_DSN && NODE_ENV === "production") {
  Sentry.init({ dsn, environment: SOLANA_NETWORK, tracesSampleRate: 0.1 });
}

function trackError(error, context) {
  Sentry.captureException(error, { extra: context, tags: { network } });
}

// New: src/lib/solana/anchor-errors.ts
const ANCHOR_ERROR_MAP = { 6000: "Vault not in funding stage", ... };
function parseAnchorError(error) {
  const match = error.message.match(/0x([0-9a-f]+)/i);
  return match ? ANCHOR_ERROR_MAP[parseInt(match[1], 16)] || error.message : error.message;
}
```

**Guardrail**: Redact wallet addresses, only log error codes in prod

### Testing

**Pattern**: Vitest for layout/reconcile/tx, smoke script for devnet validation

```typescript
// New: src/lib/vault-sdk/layout.test.ts
it("VaultLayout.dataSize must equal 192", () => {
  expect(VaultLayout.dataSize).toBe(192);
});

it("VaultLayout.authorityOffset must equal 10", () => {
  expect(VaultLayout.authorityOffset).toBe(10); // 8 discriminator + 2 version
});

// scripts/smoke.ts
const accountInfo = await connection.getAccountInfo(vaultPda);
assert(accountInfo !== null, "Vault must exist");
assert(accountInfo.data.length === 192, "Vault dataSize mismatch");
```

**Guardrail**: CI fails if layout tests fail, smoke script runs in CI with skippable RPC env

---

## Milestones & Acceptance Criteria

### M1: Performance & Real-time (Week 1-2)

**Deliverables**:
- `src/lib/solana/subscriptions.ts` - PDA subscription helpers
- `src/lib/vault-sdk/layout.ts` - Centralized offsets/filters
- `src/lib/vault-sdk/batch.ts` - Batched account reads
- Updated `useVault.ts`, `usePosition.ts` - Wire subscriptions
- Updated `fetchers.ts` - Use layout constants

**Acceptance Criteria**:
- [ ] Vault/position views refresh in <1s after on-chain change (no polling)
- [ ] List views (`useVaultsByAuthority`) use batched reads or filtered scans
- [ ] Layout tests pass: `VaultLayout.dataSize === 192`, `PositionLayout.dataSize === 89`
- [ ] All offsets centralized, no hardcoded numbers in fetchers.ts

**Files to Touch**:
- Create: `subscriptions.ts`, `layout.ts`, `batch.ts`
- Update: `useVault.ts` (add subscription), `usePosition.ts` (add subscription), `fetchers.ts` (import layout constants)

---

### M2: Transaction Reliability (Week 2-3)

**Deliverables**:
- `src/lib/vault-sdk/tx.ts` - Priority fee + minContextSlot helpers
- `src/lib/utils/reconcile.ts` - Finalized reconciliation logic
- Updated `useDeposit.ts`, `useClaim.ts` - Use fees + reconcile
- Narrow query invalidations

**Acceptance Criteria**:
- [ ] Mainnet-ready: configurable priority fee via `NEXT_PUBLIC_PRIORITY_FEE_MICROS`
- [ ] Finalized reconcile updates cache only if data differs (hash compare)
- [ ] Invalidations scoped: `["vault", authority, vaultId]` not `["vault"]`
- [ ] Failed tx rate <2% in load tests (devnet with 100 concurrent deposits)

**Files to Touch**:
- Create: `tx.ts`, `reconcile.ts`
- Update: `useDeposit.ts` (use fees, reconcile, narrow keys), `useClaim.ts` (same), `client.ts` (integrate priority fees)

---

### M3: Observability (Week 3)

**Deliverables**:
- `src/lib/solana/anchor-errors.ts` - IDL-derived error map
- Updated `error-tracking.ts` - Sentry init in prod
- Updated `connection.ts` - Retry with exponential backoff
- `src/lib/config/env.ts` - Environment validation

**Acceptance Criteria**:
- [ ] Sentry receiving prod errors with `network` tag
- [ ] User toasts show parsed Anchor messages ("Vault not in funding stage" not "0x1771")
- [ ] Retries only for idempotent reads (not writes), exponential backoff with jitter
- [ ] Prod build fails if `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT` missing (env validation)

**Files to Touch**:
- Create: `anchor-errors.ts`, `env.ts`
- Update: `error-tracking.ts` (Sentry init), `connection.ts` (retry wrapper), `useDeposit.ts` (use parseAnchorError), `useClaim.ts` (same)

---

### M4: Tests & CI (Week 4)

**Deliverables**:
- `vitest.config.ts` - Vitest setup
- `src/lib/vault-sdk/layout.test.ts` - Layout/filter tests
- `src/lib/utils/reconcile.test.ts` - Reconcile logic tests
- `src/lib/vault-sdk/tx.test.ts` - Priority fee instruction tests
- `scripts/smoke.ts` - Devnet smoke test
- `.github/workflows/ci.yml` - Lint, build, test, smoke

**Acceptance Criteria**:
- [ ] Tests >80% coverage on SDK layer (`layout.ts`, `batch.ts`, `tx.ts`, `reconcile.ts`)
- [ ] CI runs on PRs: lint → build → test → smoke (skippable without RPC env)
- [ ] Smoke script passes on devnet: fetches known vault PDA, validates dataSize

**Files to Touch**:
- Create: `vitest.config.ts`, `layout.test.ts`, `reconcile.test.ts`, `tx.test.ts`, `scripts/smoke.ts`, `.github/workflows/ci.yml`
- Update: `package.json` (add test scripts, vitest deps)

---

## Owner, Effort, Timeline

| Milestone | Owner | Est. Days | Risks | Rollback Strategy |
|-----------|-------|-----------|-------|-------------------|
| **M1** | Senior Engineer | 8-10 | Subscription leaks, wrong offsets | Feature flag subscriptions, fallback to polling |
| **M2** | Senior Engineer | 5-7 | Priority fee too low/high | Env var override, default 5000 |
| **M3** | Senior Engineer | 4-5 | Sentry quota limits | Free tier sufficient for MVP |
| **M4** | Senior Engineer | 5-6 | Flaky tests in CI | Skip smoke if no RPC env |

**Total**: 22-28 days (4-6 weeks)

---

## Risk Log & Guardrails

### Risks

1. **RPC Rate Limits**: Subscriptions hold open connections; paid RPC may throttle
   - **Mitigation**: Test with Helius/QuickNode limits, add connection pooling if needed

2. **Wrong dataSize/Offsets**: Hardcoded 192/89 bytes may break on program upgrade
   - **Mitigation**: Tests fail on mismatch, CI blocks deploy

3. **Subscription Leaks**: Not unsubscribing in useEffect cleanup → memory leaks
   - **Mitigation**: Return cleanup function, test with React StrictMode

4. **Over-Invalidations**: Narrow keys wrong → stale cache
   - **Mitigation**: Reconcile logic as safety net, manual testing

5. **Priority Fee Too Low**: Mainnet congestion → still slow
   - **Mitigation**: Env var override, monitor failed tx rate in Sentry

### Guardrails

1. **Hash Compare Before setQueryData**: Prevents unnecessary re-renders
   ```typescript
   queryClient.setQueryData(key, (old) =>
     JSON.stringify(old) === JSON.stringify(data) ? old : data
   );
   ```

2. **dataSize Tests Must Pass**: CI fails if `VaultLayout.dataSize !== 192`

3. **Unsubscribe on Unmount**: All `onPdaChange` calls return cleanup function

4. **Env Validation in Prod**: Build fails if `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT` missing

5. **Idempotent Retries Only**: Retry reads, never retry writes (deposit/claim)

---

## Appendix A: Exact File Tasks

### Create Files

**`src/lib/solana/subscriptions.ts`**:
- [ ] `onPdaChange(connection, pda, decode, onUpdate)` - Subscribe to single PDA
- [ ] `onProgramChange(connection, programId, filters, decode, onUpdate)` - Subscribe to filtered accounts
- [ ] Return cleanup functions, use `confirmed` commitment

**`src/lib/vault-sdk/layout.ts`**:
- [ ] `VaultLayout = { dataSize: 192, discriminatorOffset: 0, versionOffset: 8, authorityOffset: 10, ... }`
- [ ] `PositionLayout = { dataSize: 89, discriminatorOffset: 0, vaultOffset: 8, ownerOffset: 40, ... }`
- [ ] `vaultFilters(authority?: PublicKey)` - Returns filters array
- [ ] `positionFilters(user?: PublicKey)` - Returns filters array

**`src/lib/vault-sdk/batch.ts`**:
- [ ] `fetchMultipleVaults(connection, authority)` - Uses `getProgramAccounts` with filters
- [ ] `fetchMultiplePositions(connection, user)` - Uses `getProgramAccounts` with filters
- [ ] Returns decoded accounts

**`src/lib/vault-sdk/tx.ts`**:
- [ ] `withPriorityFee(instructions, { microLamports?, units? })` - Prepend ComputeBudget instructions
- [ ] `confirmWithMinContextSlot(connection, signature, minContextSlot)` - Confirm with slot tracking
- [ ] `recentBlockhashWithContext(connection)` - Returns `{ blockhash, contextSlot }`

**`src/lib/utils/reconcile.ts`**:
- [ ] `reconcileFinalized(connection, pubkeys, decode, onChange)` - Fetch with finalized, call onChange only if differs
- [ ] Hash compare logic

**`src/lib/solana/anchor-errors.ts`**:
- [ ] `ANCHOR_ERROR_MAP = { 6000: "...", 6001: "...", ... }` - Extract from IDL errors
- [ ] `parseAnchorError(error: Error): string` - Regex match + map lookup

**`src/lib/config/env.ts`**:
- [ ] `requireEnv(key: string, prodOnly = true): string` - Throws if missing in prod
- [ ] `validateEnv()` - Called in app startup, checks RPC endpoint

**`vitest.config.ts`**:
- [ ] Vitest config, test file patterns

**`src/lib/vault-sdk/layout.test.ts`**:
- [ ] Test `VaultLayout.dataSize === 192`
- [ ] Test `PositionLayout.dataSize === 89`
- [ ] Test `vaultFilters()` generates correct dataSize filter
- [ ] Test `vaultFilters(authority)` generates memcmp filter at offset 10

**`src/lib/utils/reconcile.test.ts`**:
- [ ] Mock Connection with getMultipleAccountsInfo
- [ ] Test change detection (onChange called only if data differs)

**`src/lib/vault-sdk/tx.test.ts`**:
- [ ] Test `withPriorityFee` prepends 2 ComputeBudget instructions
- [ ] Test default microLamports = 5000

**`scripts/smoke.ts`**:
- [ ] Fetch known vault PDA on devnet
- [ ] Assert accountInfo.data.length === 192
- [ ] Print exists, owner, dataLength

**`.github/workflows/ci.yml`**:
- [ ] Lint: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Test: `npm run test`
- [ ] Smoke: `npm run smoke` (skippable if no `SOLANA_RPC_ENDPOINT` env)

### Update Files

**`src/lib/vault-hooks/useVault.ts`**:
- [ ] Import `onPdaChange`, `useConnection`, `useQueryClient`
- [ ] Add `useEffect` to subscribe to vault PDA
- [ ] Hash compare before `setQueryData`
- [ ] Return unsubscribe in cleanup

**`src/lib/vault-hooks/usePosition.ts`**:
- [ ] Same pattern as `useVault.ts`
- [ ] Subscribe to position PDA

**`src/lib/vault-hooks/useDeposit.ts`**:
- [ ] Import `parseAnchorError`, `reconcileFinalized`, `getVaultPda`, `getPositionPda`
- [ ] Update `onError`: use `parseAnchorError(error)`
- [ ] Update `onSuccess`: narrow invalidations to `["vault", authority, vaultId]` and `["position", vaultPda, user]`
- [ ] After confirmed, call `reconcileFinalized([vaultPda, positionPda], ...)`

**`src/lib/vault-hooks/useClaim.ts`**:
- [ ] Same updates as `useDeposit.ts`

**`src/lib/vault-sdk/client.ts`**:
- [ ] Import `withPriorityFee` from `tx.ts`
- [ ] In `deposit()`, wrap instruction with priority fees
- [ ] In `claim()`, wrap instruction with priority fees

**`src/lib/vault-sdk/fetchers.ts`**:
- [ ] Import `VaultLayout`, `PositionLayout` from `layout.ts`
- [ ] Replace hardcoded `offset: 8 + 2` with `VaultLayout.authorityOffset` (line 74)
- [ ] Replace hardcoded `offset: 8 + 32` with `PositionLayout.ownerOffset` (line 149)

**`src/lib/error-tracking.ts`**:
- [ ] Remove TODO comment (line 21)
- [ ] Import `@sentry/nextjs`
- [ ] Add Sentry init in prod block
- [ ] Update `trackError` to call `Sentry.captureException`

**`src/lib/solana/connection.ts`**:
- [ ] Add `fetchWithRetry(fn, maxRetries = 3, baseDelay = 1000)` - Exponential backoff with jitter
- [ ] Wrap reads in retry, not writes
- [ ] Export `recentBlockhashWithContext` using retry

**`package.json`**:
- [ ] Add scripts: `"test": "vitest"`, `"test:ui": "vitest --ui"`, `"smoke": "tsx scripts/smoke.ts"`
- [ ] Add devDependencies: `vitest@^2.0.0`, `@vitest/ui@^2.0.0`, `@testing-library/react@^16.0.0`, `tsx@^4.0.0`
- [ ] Add dependencies: `@sentry/nextjs@^8.0.0`

---

## Appendix B: Metrics to Track

**Performance**:
- `rpc_calls_per_page_load` - Target: <5 (currently ~20-50)
- `subscription_active_count` - Monitor for leaks
- `p95_data_freshness_after_write` - Target: <1s (currently 30s polling)

**Reliability**:
- `failed_tx_rate` - Target: <2% (currently ~10% without priority fees)
- `tx_confirmation_time_p95` - Target: <5s mainnet (currently 20-60s)

**Observability**:
- `sentry_error_count` - Track production errors
- `anchor_error_parse_rate` - % of errors successfully parsed

**Testing**:
- `test_coverage_sdk` - Target: >80%
- `ci_pass_rate` - Target: 100%

---

## Doc vs Code Delta

**Corrections Made**:

1. **Package Version**: Docs claimed `0.1.0`, actual is `0.1.4` (verified package.json:14)
2. **Account Sizes**: Docs had placeholders (200, 128), actual from IDL: Vault 192 bytes, Position 89 bytes
3. **Offset Values**: Docs had `authorityOffset: 10` (correct), `userOffset: 40` (actually `ownerOffset: 40` for Position)
4. **Existing CI**: Docs said "no CI", actual has `.github/workflows/claude-code-review.yml` and `claude.yml`
5. **Missing Files**: Docs claimed scripts/smoke.ts exists, actual: directory doesn't exist yet
6. **Commitment**: Docs said "confirmed" used everywhere, verified connection.ts:7 `DEFAULT_COMMITMENT: "confirmed"`

**Status Claims Verified**:
- ✅ No subscriptions.ts, batch.ts, layout.ts, tx.ts, reconcile.ts, anchor-errors.ts (all need creation)
- ✅ No tests in src/ (verified)
- ✅ Broad invalidations in useDeposit.ts:52-60 (verified)
- ✅ Hardcoded offsets in fetchers.ts:74, 149 (verified)
- ✅ Sentry TODO in error-tracking.ts:21 (verified)

---

**End of Plan**
