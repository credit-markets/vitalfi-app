import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { VaultLayout, PositionLayout, memcmpFilterAuthority, memcmpFilterOwner } from './layout';

describe('VaultLayout', () => {
  it('should have correct data size', () => {
    expect(VaultLayout.size).toBe(200);
  });

  it('should have correct authority offset', () => {
    // After discriminator (8) + version (2)
    expect(VaultLayout.authorityOffset).toBe(10);
  });

  it('should have correct vault_id offset', () => {
    // After discriminator (8) + version (2) + authority (32)
    expect(VaultLayout.vaultIdOffset).toBe(42);
  });
});

describe('PositionLayout', () => {
  it('should have correct data size', () => {
    expect(PositionLayout.size).toBe(89);
  });

  it('should have correct vault offset', () => {
    // After discriminator (8)
    expect(PositionLayout.vaultOffset).toBe(8);
  });

  it('should have correct owner offset', () => {
    // After discriminator (8) + vault (32)
    expect(PositionLayout.ownerOffset).toBe(40);
  });
});

describe('memcmpFilterAuthority', () => {
  it('should generate correct memcmp filter for authority', () => {
    const authority = new PublicKey('11111111111111111111111111111111');
    const filter = memcmpFilterAuthority(authority);

    expect(filter).toEqual({
      memcmp: {
        offset: VaultLayout.authorityOffset,
        bytes: authority.toBase58(),
      },
    });
  });

  it('should use correct offset (10)', () => {
    const authority = new PublicKey('11111111111111111111111111111111');
    const filter = memcmpFilterAuthority(authority);

    expect(filter.memcmp.offset).toBe(10);
  });

  it('should encode authority as base58', () => {
    const authorityKey = 'So11111111111111111111111111111111111111112'; // Example: wSOL mint
    const authority = new PublicKey(authorityKey);
    const filter = memcmpFilterAuthority(authority);

    expect(filter.memcmp.bytes).toBe(authorityKey);
  });
});

describe('memcmpFilterOwner', () => {
  it('should generate correct memcmp filter for owner', () => {
    const owner = new PublicKey('11111111111111111111111111111111');
    const filter = memcmpFilterOwner(owner);

    expect(filter).toEqual({
      memcmp: {
        offset: PositionLayout.ownerOffset,
        bytes: owner.toBase58(),
      },
    });
  });

  it('should use correct offset (40)', () => {
    const owner = new PublicKey('11111111111111111111111111111111');
    const filter = memcmpFilterOwner(owner);

    expect(filter.memcmp.offset).toBe(40);
  });

  it('should encode owner as base58', () => {
    const ownerKey = 'So11111111111111111111111111111111111111112';
    const owner = new PublicKey(ownerKey);
    const filter = memcmpFilterOwner(owner);

    expect(filter.memcmp.bytes).toBe(ownerKey);
  });
});

describe('Layout Constants - Integration', () => {
  it('should calculate offsets correctly based on field sizes', () => {
    // Vault layout verification
    const discriminator = 8;
    const version = 2;
    expect(VaultLayout.authorityOffset).toBe(discriminator + version);

    const authority = 32;
    expect(VaultLayout.vaultIdOffset).toBe(discriminator + version + authority);
  });

  it('should calculate position offsets correctly', () => {
    // Position layout verification
    const discriminator = 8;
    expect(PositionLayout.vaultOffset).toBe(discriminator);

    const vault = 32;
    expect(PositionLayout.ownerOffset).toBe(discriminator + vault);
  });

  it('should match phase3_tasks.json account structure', () => {
    // From phase3_tasks.json accountStructures
    expect(VaultLayout.size).toBe(200); // Was 192 in old spec, updated to 200
    expect(PositionLayout.size).toBe(89);
    expect(VaultLayout.authorityOffset).toBe(10);
    expect(PositionLayout.ownerOffset).toBe(40);
  });
});
