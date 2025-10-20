import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ComputeBudgetProgram, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getPriorityFee, withPriorityFee } from './tx';

describe('getPriorityFee', () => {
  const originalEnv = process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS;

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS;
    }
  });

  it('should return default fee when no env var set', () => {
    delete process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS;
    expect(getPriorityFee()).toBe(5000);
  });

  it('should return env var value when valid', () => {
    process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = '10000';
    expect(getPriorityFee()).toBe(10000);
  });

  it('should return minimum when env var is too low', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = '50';

    expect(getPriorityFee()).toBe(100); // MIN_PRIORITY_FEE_MICROS
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('below minimum')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return maximum when env var is too high', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = '200000';

    expect(getPriorityFee()).toBe(100000); // MAX_PRIORITY_FEE_MICROS
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('above maximum')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return default when env var is invalid', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = 'invalid';

    expect(getPriorityFee()).toBe(5000);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid NEXT_PUBLIC_PRIORITY_FEE_MICROS')
    );

    consoleWarnSpy.mockRestore();
  });
});

describe('withPriorityFee', () => {
  let mockInstruction: TransactionInstruction;

  beforeEach(() => {
    mockInstruction = {
      keys: [],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: Buffer.from([]),
    };
  });

  it('should prepend 2 ComputeBudget instructions', () => {
    const instructions = withPriorityFee([mockInstruction]);

    expect(instructions).toHaveLength(3);
    expect(instructions[0].programId).toEqual(ComputeBudgetProgram.programId);
    expect(instructions[1].programId).toEqual(ComputeBudgetProgram.programId);
    expect(instructions[2]).toBe(mockInstruction);
  });

  it('should use default microLamports (5000)', () => {
    delete process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS;
    const instructions = withPriorityFee([mockInstruction]);

    // Check that setComputeUnitPrice was called with default
    const priceInstruction = instructions[1];
    expect(priceInstruction.programId).toEqual(ComputeBudgetProgram.programId);

    // The instruction should be setComputeUnitPrice with 5000 microlamports
    const expectedInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 });
    expect(priceInstruction.data).toEqual(expectedInstruction.data);
  });

  it('should use custom microLamports when provided', () => {
    const instructions = withPriorityFee([mockInstruction], { microLamports: 10000 });

    const priceInstruction = instructions[1];
    const expectedInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 });
    expect(priceInstruction.data).toEqual(expectedInstruction.data);
  });

  it('should use default compute units (200000)', () => {
    const instructions = withPriorityFee([mockInstruction]);

    const limitInstruction = instructions[0];
    const expectedInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 });
    expect(limitInstruction.data).toEqual(expectedInstruction.data);
  });

  it('should use custom compute units when provided', () => {
    const instructions = withPriorityFee([mockInstruction], { units: 300000 });

    const limitInstruction = instructions[0];
    const expectedInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 });
    expect(limitInstruction.data).toEqual(expectedInstruction.data);
  });

  it('should preserve order: limit, price, then program instructions', () => {
    const ix1 = { ...mockInstruction };
    const ix2 = { ...mockInstruction };

    const instructions = withPriorityFee([ix1, ix2], { microLamports: 5000, units: 200000 });

    expect(instructions).toHaveLength(4);

    // First should be setComputeUnitLimit
    const limitInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 });
    expect(instructions[0].data).toEqual(limitInstruction.data);

    // Second should be setComputeUnitPrice
    const priceInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 });
    expect(instructions[1].data).toEqual(priceInstruction.data);

    // Rest should be original instructions
    expect(instructions[2]).toBe(ix1);
    expect(instructions[3]).toBe(ix2);
  });

  it('should work with empty instructions array', () => {
    const instructions = withPriorityFee([]);

    expect(instructions).toHaveLength(2);
    expect(instructions[0].programId).toEqual(ComputeBudgetProgram.programId);
    expect(instructions[1].programId).toEqual(ComputeBudgetProgram.programId);
  });

  it('should read from env var when options not provided', () => {
    process.env.NEXT_PUBLIC_PRIORITY_FEE_MICROS = '7500';

    const instructions = withPriorityFee([mockInstruction]);

    const priceInstruction = instructions[1];
    const expectedInstruction = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 7500 });
    expect(priceInstruction.data).toEqual(expectedInstruction.data);
  });
});

describe('withPriorityFee integration', () => {
  it('should create valid ComputeBudget instructions', () => {
    const mockIx = {
      keys: [],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: Buffer.from([1, 2, 3]),
    };

    const result = withPriorityFee([mockIx], {
      microLamports: 5000,
      units: 200000,
    });

    // Verify instruction structure
    expect(result[0]).toHaveProperty('keys');
    expect(result[0]).toHaveProperty('programId');
    expect(result[0]).toHaveProperty('data');

    expect(result[1]).toHaveProperty('keys');
    expect(result[1]).toHaveProperty('programId');
    expect(result[1]).toHaveProperty('data');

    // Verify both ComputeBudget instructions use the correct program
    expect(result[0].programId.toBase58()).toBe(ComputeBudgetProgram.programId.toBase58());
    expect(result[1].programId.toBase58()).toBe(ComputeBudgetProgram.programId.toBase58());
  });
});
