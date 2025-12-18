import { describe, expect, it } from 'vitest';
import fixture from './fixtures/moralisHistory.json';
import { detectOperationType, extractUsdcToWbtcSwaps, normalizeTransactions, NormalizedTransaction } from '../src';

describe('core normalization', () => {
  const normalized = normalizeTransactions(fixture);

  it('detects operation types from Moralis categories', () => {
    const categories = fixture.map((tx) => detectOperationType(tx));
    expect(categories).toEqual(['swap', 'transfer', 'approve', 'swap']);
  });

  it('normalizes timestamps, hashes, tokens and protocol fields', () => {
    const first = normalized[0];
    expect(first.timestampISO).toBe('2024-05-14T12:00:00.000Z');
    expect(first.txHash).toBe('0xswap1');
    expect(first.tokenIn).toBe('USDC');
    expect(first.tokenOut).toBe('WBTC');
    expect(first.protocol).toBe('Uniswap V3');
  });

  it('captures transfers with direction awareness', () => {
    const transfer = normalized[1];
    expect(transfer.type).toBe('transfer');
    expect(transfer.tokenOut).toBe('ETH');
    expect(transfer.amountOut).toBe('0.5');
  });

  it('extracts only USDC -> WBTC swaps', () => {
    const swaps: NormalizedTransaction[] = extractUsdcToWbtcSwaps(normalized);
    expect(swaps).toHaveLength(1);
    expect(swaps[0].txHash).toBe('0xswap1');
    expect(swaps[0].amountIn).toBe('1500');
  });
});
