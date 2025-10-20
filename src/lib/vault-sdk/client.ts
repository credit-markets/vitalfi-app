import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import type { VitalfiVault, VaultAccount, PositionAccount } from "./types";
import {
  fetchVault,
  fetchVaultByPda,
  fetchAllVaults,
  fetchAllVaultsByAuthority,
  fetchPosition,
  fetchAllPositionsByUser,
  vaultExists,
  positionExists,
} from "./fetchers";
import { getVaultPda, getVaultTokenPda, getPositionPda, getAllPdas } from "./pdas";
import { withPriorityFee } from "./tx";

/**
 * VaultClient
 *
 * High-level client for interacting with the VitalFi Vault program.
 * Provides convenient methods for common operations.
 *
 * @example
 * ```typescript
 * const client = new VaultClient(program);
 * const vault = await client.getVault(authority, vaultId);
 * const txSig = await client.deposit(vaultId, authority, amount, userTokenAccount);
 * ```
 */
export class VaultClient {
  constructor(private program: Program<VitalfiVault>) {}

  // ============================================
  // Fetching Methods
  // ============================================

  /**
   * Get vault account data
   */
  async getVault(authority: PublicKey, vaultId: BN): Promise<VaultAccount | null> {
    return fetchVault(this.program, authority, vaultId);
  }

  /**
   * Get vault account by PDA
   */
  async getVaultByPda(vaultPda: PublicKey): Promise<VaultAccount | null> {
    return fetchVaultByPda(this.program, vaultPda);
  }

  /**
   * Get all vaults by authority
   */
  async getVaultsByAuthority(
    authority: PublicKey
  ): Promise<Array<{ pubkey: PublicKey; account: VaultAccount }>> {
    return fetchAllVaultsByAuthority(this.program, authority);
  }

  /**
   * Get all vaults (WARNING: can be expensive)
   */
  async getAllVaults(): Promise<Array<{ pubkey: PublicKey; account: VaultAccount }>> {
    return fetchAllVaults(this.program);
  }

  /**
   * Get user position in a vault
   */
  async getPosition(vaultPda: PublicKey, user: PublicKey): Promise<PositionAccount | null> {
    return fetchPosition(this.program, vaultPda, user);
  }

  /**
   * Get all positions for a user
   */
  async getUserPositions(
    user: PublicKey
  ): Promise<Array<{ pubkey: PublicKey; account: PositionAccount }>> {
    return fetchAllPositionsByUser(this.program, user);
  }

  /**
   * Check if vault exists
   */
  async vaultExists(authority: PublicKey, vaultId: BN): Promise<boolean> {
    return vaultExists(this.program, authority, vaultId);
  }

  /**
   * Check if position exists
   */
  async positionExists(vaultPda: PublicKey, user: PublicKey): Promise<boolean> {
    return positionExists(this.program, vaultPda, user);
  }

  // ============================================
  // Transaction Methods
  // ============================================

  /**
   * Deposit tokens into a vault
   *
   * @param vaultId - Vault ID
   * @param authority - Vault authority
   * @param amount - Amount to deposit (in token units)
   * @param assetMint - SPL token mint
   * @returns Transaction signature
   */
  async deposit(
    vaultId: BN,
    authority: PublicKey,
    amount: BN,
    assetMint: PublicKey
  ): Promise<string> {
    const user = this.program.provider.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const pdas = getAllPdas(authority, vaultId, user);

    // Get user's token account
    const userTokenAccount = getAssociatedTokenAddressSync(assetMint, user);

    // Build instruction
    const ix = await this.program.methods
      .deposit(amount)
      .accountsPartial({
        vault: pdas.vault,
        vaultTokenAccount: pdas.vaultToken,
        position: pdas.position!,
        userTokenAccount,
        user,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Add priority fees (prepends ComputeBudget instructions)
    const txInstructions = withPriorityFee([ix]);

    // Execute transaction with priority fees
    const txSig = await this.program.methods
      .deposit(amount)
      .accountsPartial({
        vault: pdas.vault,
        vaultTokenAccount: pdas.vaultToken,
        position: pdas.position!,
        userTokenAccount,
        user,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(txInstructions.slice(0, 2)) // Only ComputeBudget instructions
      .rpc();

    return txSig;
  }

  /**
   * Claim refund or payout from a vault
   *
   * @param vaultId - Vault ID
   * @param authority - Vault authority
   * @param assetMint - SPL token mint
   * @returns Transaction signature
   */
  async claim(vaultId: BN, authority: PublicKey, assetMint: PublicKey): Promise<string> {
    const user = this.program.provider.publicKey;
    if (!user) throw new Error("Wallet not connected");

    const pdas = getAllPdas(authority, vaultId, user);

    // Get user's token account
    const userTokenAccount = getAssociatedTokenAddressSync(assetMint, user);

    // Build instruction
    const ix = await this.program.methods
      .claim()
      .accountsPartial({
        vault: pdas.vault,
        vaultTokenAccount: pdas.vaultToken,
        position: pdas.position!,
        userTokenAccount,
        user,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Add priority fees (prepends ComputeBudget instructions)
    const txInstructions = withPriorityFee([ix]);

    // Execute transaction with priority fees
    const txSig = await this.program.methods
      .claim()
      .accountsPartial({
        vault: pdas.vault,
        vaultTokenAccount: pdas.vaultToken,
        position: pdas.position!,
        userTokenAccount,
        user,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(txInstructions.slice(0, 2)) // Only ComputeBudget instructions
      .rpc();

    return txSig;
  }

  /**
   * Initialize a new vault (authority only)
   *
   * @param vaultId - Unique vault ID
   * @param cap - Maximum capacity
   * @param targetApyBps - Target APY in basis points
   * @param fundingEndTs - Funding end timestamp
   * @param maturityTs - Maturity timestamp
   * @param minDeposit - Minimum deposit amount
   * @param assetMint - SPL token mint
   * @returns Transaction signature
   */
  async initializeVault(
    vaultId: BN,
    cap: BN,
    targetApyBps: number,
    fundingEndTs: BN,
    maturityTs: BN,
    minDeposit: BN,
    assetMint: PublicKey
  ): Promise<string> {
    const authority = this.program.provider.publicKey;
    if (!authority) throw new Error("Wallet not connected");

    const [vault] = getVaultPda(authority, vaultId);
    const [vaultTokenAccount] = getVaultTokenPda(vault);

    // Build instruction with priority fee
    const ix = await this.program.methods
      .initializeVault(vaultId, cap, targetApyBps, fundingEndTs, maturityTs, minDeposit)
      .accountsPartial({
        vault,
        vaultTokenAccount,
        assetMint,
        authority,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    // Add priority fee and execute
    const priorityIx = withPriorityFee([ix]);
    const txSig = await this.program.methods
      .initializeVault(vaultId, cap, targetApyBps, fundingEndTs, maturityTs, minDeposit)
      .accountsPartial({
        vault,
        vaultTokenAccount,
        assetMint,
        authority,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .preInstructions(priorityIx.slice(0, 2)) // ComputeBudget instructions only
      .rpc();

    return txSig;
  }

  /**
   * Finalize funding (authority only)
   *
   * @param vaultId - Vault ID
   * @param assetMint - SPL token mint
   * @returns Transaction signature
   */
  async finalizeFunding(vaultId: BN, assetMint: PublicKey): Promise<string> {
    const authority = this.program.provider.publicKey;
    if (!authority) throw new Error("Wallet not connected");

    const [vault] = getVaultPda(authority, vaultId);
    const [vaultTokenAccount] = getVaultTokenPda(vault);
    const authorityTokenAccount = getAssociatedTokenAddressSync(assetMint, authority);

    // Build instruction with priority fee
    const ix = await this.program.methods
      .finalizeFunding()
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authorityTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Add priority fee and execute
    const priorityIx = withPriorityFee([ix]);
    const txSig = await this.program.methods
      .finalizeFunding()
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authorityTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(priorityIx.slice(0, 2)) // ComputeBudget instructions only
      .rpc();

    return txSig;
  }

  /**
   * Mature vault with returned funds (authority only)
   *
   * @param vaultId - Vault ID
   * @param returnAmount - Amount returned (principal + yield)
   * @param assetMint - SPL token mint
   * @returns Transaction signature
   */
  async matureVault(vaultId: BN, returnAmount: BN, assetMint: PublicKey): Promise<string> {
    const authority = this.program.provider.publicKey;
    if (!authority) throw new Error("Wallet not connected");

    const [vault] = getVaultPda(authority, vaultId);
    const [vaultTokenAccount] = getVaultTokenPda(vault);
    const authorityTokenAccount = getAssociatedTokenAddressSync(assetMint, authority);

    // Build instruction with priority fee
    const ix = await this.program.methods
      .matureVault(returnAmount)
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authorityTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Add priority fee and execute
    const priorityIx = withPriorityFee([ix]);
    const txSig = await this.program.methods
      .matureVault(returnAmount)
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authorityTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(priorityIx.slice(0, 2)) // ComputeBudget instructions only
      .rpc();

    return txSig;
  }

  /**
   * Close vault and reclaim rent (authority only)
   *
   * @param vaultId - Vault ID
   * @returns Transaction signature
   */
  async closeVault(vaultId: BN): Promise<string> {
    const authority = this.program.provider.publicKey;
    if (!authority) throw new Error("Wallet not connected");

    const [vault] = getVaultPda(authority, vaultId);
    const [vaultTokenAccount] = getVaultTokenPda(vault);

    // Build instruction with priority fee
    const ix = await this.program.methods
      .closeVault()
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // Add priority fee and execute
    const priorityIx = withPriorityFee([ix]);
    const txSig = await this.program.methods
      .closeVault()
      .accountsPartial({
        vault,
        vaultTokenAccount,
        authority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(priorityIx.slice(0, 2)) // ComputeBudget instructions only
      .rpc();

    return txSig;
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Get all PDAs for a vault and optionally a user
   */
  getPdas(authority: PublicKey, vaultId: BN, user?: PublicKey) {
    return getAllPdas(authority, vaultId, user);
  }

  /**
   * Get vault PDA
   */
  getVaultPda(authority: PublicKey, vaultId: BN): [PublicKey, number] {
    return getVaultPda(authority, vaultId);
  }

  /**
   * Get vault token account PDA
   */
  getVaultTokenPda(vault: PublicKey): [PublicKey, number] {
    return getVaultTokenPda(vault);
  }

  /**
   * Get position PDA
   */
  getPositionPda(vault: PublicKey, user: PublicKey): [PublicKey, number] {
    return getPositionPda(vault, user);
  }
}
