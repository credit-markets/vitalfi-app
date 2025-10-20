import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import { reconcileFinalized, reconcileSingleAccount } from './reconcile';

// Mock connection
const createMockConnection = () => {
  return {
    getMultipleAccountsInfo: vi.fn(),
  } as unknown as Connection;
};

describe('reconcileFinalized', () => {
  let connection: Connection;
  let mockDecode: ReturnType<typeof vi.fn>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    connection = createMockConnection();
    mockDecode = vi.fn((data: Buffer) => ({ decoded: data.toString('hex') }));
    mockOnChange = vi.fn();
  });

  it('should fetch accounts with finalized commitment', async () => {
    const pubkeys = [new PublicKey('11111111111111111111111111111111')];
    const mockData = Buffer.from('test data');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data: mockData, executable: false, owner: pubkeys[0], lamports: 0, rentEpoch: 0 },
    ]);

    await reconcileFinalized(connection, pubkeys, mockDecode, mockOnChange);

    expect(connection.getMultipleAccountsInfo).toHaveBeenCalledWith(
      pubkeys,
      'finalized'
    );
  });

  it('should call onChange when data differs', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const oldData = Buffer.from('old');
    const newData = Buffer.from('new');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data: newData, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    const currentDataMap = new Map([[pubkey.toBase58(), oldData]]);

    await reconcileFinalized(
      connection,
      [pubkey],
      mockDecode,
      mockOnChange,
      currentDataMap
    );

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockDecode).toHaveBeenCalledWith(newData);
  });

  it('should NOT call onChange when data is identical', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const sameData = Buffer.from('same data');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data: sameData, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    const currentDataMap = new Map([[pubkey.toBase58(), sameData]]);

    await reconcileFinalized(
      connection,
      [pubkey],
      mockDecode,
      mockOnChange,
      currentDataMap
    );

    // onChange should NOT be called because data is identical
    expect(mockOnChange).not.toHaveBeenCalled();
    expect(mockDecode).not.toHaveBeenCalled();
  });

  it('should call onChange when currentDataMap is not provided', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const data = Buffer.from('data');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    await reconcileFinalized(connection, [pubkey], mockDecode, mockOnChange);

    // Should call onChange since no current data to compare
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple accounts', async () => {
    const pubkey1 = new PublicKey('11111111111111111111111111111112');
    const pubkey2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const data1 = Buffer.from('data1');
    const data2 = Buffer.from('data2');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data: data1, executable: false, owner: pubkey1, lamports: 0, rentEpoch: 0 },
      { data: data2, executable: false, owner: pubkey2, lamports: 0, rentEpoch: 0 },
    ]);

    await reconcileFinalized(
      connection,
      [pubkey1, pubkey2],
      mockDecode,
      mockOnChange
    );

    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockDecode).toHaveBeenCalledWith(data1);
    expect(mockDecode).toHaveBeenCalledWith(data2);
  });

  it('should skip null accounts with warning', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([null]);

    await reconcileFinalized(connection, [pubkey], mockDecode, mockOnChange);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Account not found during reconciliation')
    );
    expect(mockOnChange).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle decode errors gracefully', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const data = Buffer.from('invalid');
    const decodeError = new Error('Decode failed');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    const failingDecode = vi.fn(() => {
      throw decodeError;
    });

    await reconcileFinalized(connection, [pubkey], failingDecode, mockOnChange);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to decode account'),
      decodeError
    );
    expect(mockOnChange).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle RPC errors gracefully', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const rpcError = new Error('RPC failed');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(connection.getMultipleAccountsInfo).mockRejectedValue(rpcError);

    // Should not throw
    await expect(
      reconcileFinalized(connection, [pubkey], mockDecode, mockOnChange)
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Finalized reconciliation failed:',
      rpcError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty pubkeys array', async () => {
    await reconcileFinalized(connection, [], mockDecode, mockOnChange);

    expect(connection.getMultipleAccountsInfo).not.toHaveBeenCalled();
  });
});

describe('reconcileSingleAccount', () => {
  let connection: Connection;
  let mockDecode: ReturnType<typeof vi.fn>;
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    connection = createMockConnection();
    mockDecode = vi.fn((data: Buffer) => ({ decoded: data.toString('hex') }));
    mockOnChange = vi.fn();
  });

  it('should reconcile a single account', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const data = Buffer.from('data');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    await reconcileSingleAccount(connection, pubkey, mockDecode, mockOnChange);

    expect(connection.getMultipleAccountsInfo).toHaveBeenCalledWith(
      [pubkey],
      'finalized'
    );
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should pass currentData for comparison', async () => {
    const pubkey = new PublicKey('11111111111111111111111111111111');
    const sameData = Buffer.from('same');

    vi.mocked(connection.getMultipleAccountsInfo).mockResolvedValue([
      { data: sameData, executable: false, owner: pubkey, lamports: 0, rentEpoch: 0 },
    ]);

    await reconcileSingleAccount(
      connection,
      pubkey,
      mockDecode,
      mockOnChange,
      sameData
    );

    // Should not call onChange since data is identical
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
