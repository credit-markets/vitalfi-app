"use client";

import { FC, ReactNode, useMemo, createContext, useContext } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { VitalfiVault, VitalfiVaultIDL } from "@/lib/vault-sdk/types";

/**
 * Anchor Program Context
 *
 * Provides the Anchor program instance to all child components.
 * Automatically updates when wallet or connection changes.
 */

interface ProgramContextType {
  program: Program<VitalfiVault> | null;
  provider: AnchorProvider | null;
}

const ProgramContext = createContext<ProgramContextType>({
  program: null,
  provider: null,
});

export const VaultProgramProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const value = useMemo(() => {
    if (!wallet) {
      return { program: null, provider: null };
    }

    // Create Anchor provider
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    // Create program instance
    const program = new Program<VitalfiVault>(
      VitalfiVaultIDL as Idl,
      provider
    );

    return { program, provider };
  }, [connection, wallet]);

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
};

/**
 * Hook to access the Vault program instance
 *
 * @throws Error if used outside VaultProgramProvider
 * @returns Program instance and provider (null if wallet not connected)
 */
export function useVaultProgram() {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error(
      "useVaultProgram must be used within VaultProgramProvider"
    );
  }
  return context;
}
