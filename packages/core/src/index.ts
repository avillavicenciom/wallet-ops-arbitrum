export type OperationType =
  | 'swap'
  | 'transfer'
  | 'approve'
  | 'borrow'
  | 'repay'
  | 'liquidity'
  | 'unknown';

export interface RawMoralisTransaction {
  [key: string]: unknown;
  hash?: string;
  tx_hash?: string;
  transaction_hash?: string;
  block_timestamp?: string;
  block_time?: string;
  timestamp?: string;
  category?: string;
  direction?: string;
  asset?: string;
  token_symbol?: string;
  token_in?: string;
  token_out?: string;
  amount_in?: string | number;
  amount_out?: string | number;
  amount?: string | number;
  usd_value?: number;
  value_usd?: number;
  protocol_name?: string;
}

export interface NormalizedTransaction {
  timestampISO: string;
  type: OperationType;
  tokenIn?: string;
  amountIn?: string;
  tokenOut?: string;
  amountOut?: string;
  valueUSD?: number;
  protocol?: string;
  txHash: string;
}

const TOKEN_NORMALIZATION = {
  USDC: ['usdc', 'usd-coin'],
  WBTC: ['wbtc', 'wrapped-btc', 'wrapped-bitcoin']
};

const normalizeTokenSymbol = (symbol?: string): string | undefined => {
  if (!symbol) return undefined;
  return symbol.trim().toUpperCase();
};

const extractHash = (tx: RawMoralisTransaction): string => {
  return (
    (typeof tx.hash === 'string' && tx.hash) ||
    (typeof tx.tx_hash === 'string' && tx.tx_hash) ||
    (typeof tx.transaction_hash === 'string' && tx.transaction_hash) ||
    ''
  );
};

const extractTimestamp = (tx: RawMoralisTransaction): string => {
  const candidate =
    (typeof tx.block_timestamp === 'string' && tx.block_timestamp) ||
    (typeof tx.block_time === 'string' && tx.block_time) ||
    (typeof tx.timestamp === 'string' && tx.timestamp) ||
    new Date().toISOString();
  const date = new Date(candidate);
  return date.toISOString();
};

const guessTokensFromDirection = (tx: RawMoralisTransaction) => {
  const asset = normalizeTokenSymbol((tx.asset as string) || (tx.token_symbol as string));
  const amount = tx.amount !== undefined ? String(tx.amount) : undefined;
  if (!tx.direction) {
    return { tokenIn: asset, amountIn: amount, tokenOut: undefined, amountOut: undefined };
  }
  const direction = String(tx.direction).toLowerCase();
  if (direction === 'send' || direction === 'out') {
    return { tokenIn: asset, amountIn: amount, tokenOut: undefined, amountOut: undefined };
  }
  if (direction === 'receive' || direction === 'in') {
    return { tokenIn: undefined, amountIn: undefined, tokenOut: asset, amountOut: amount };
  }
  return { tokenIn: asset, amountIn: amount, tokenOut: undefined, amountOut: undefined };
};

const resolveValueUSD = (tx: RawMoralisTransaction): number | undefined => {
  if (typeof tx.usd_value === 'number') return tx.usd_value;
  if (typeof tx.value_usd === 'number') return tx.value_usd;
  return undefined;
};

export const detectOperationType = (tx: RawMoralisTransaction): OperationType => {
  const category = (tx.category as string | undefined)?.toLowerCase() || '';
  if (category.includes('swap') || category.includes('dex')) return 'swap';
  if (category.includes('transfer')) return 'transfer';
  if (category.includes('approve') || category.includes('approval')) return 'approve';
  if (category.includes('borrow')) return 'borrow';
  if (category.includes('repay')) return 'repay';
  if (category.includes('liquidity') || category.includes('lp')) return 'liquidity';
  if (tx.direction) return 'transfer';
  return 'unknown';
};

export const normalizeTransactions = (
  rawTxs: RawMoralisTransaction[]
): NormalizedTransaction[] => {
  return rawTxs.map((tx) => {
    const type = detectOperationType(tx);
    const guessedTokens = guessTokensFromDirection(tx);
    const tokenIn =
      normalizeTokenSymbol(tx.token_in as string) ||
      normalizeTokenSymbol(tx.token_symbol as string) ||
      guessedTokens.tokenIn;
    const tokenOut = normalizeTokenSymbol(tx.token_out as string) || guessedTokens.tokenOut;
    const amountIn = tx.amount_in !== undefined ? String(tx.amount_in) : guessedTokens.amountIn;
    const amountOut = tx.amount_out !== undefined ? String(tx.amount_out) : guessedTokens.amountOut;

    return {
      timestampISO: extractTimestamp(tx),
      type,
      tokenIn,
      amountIn,
      tokenOut,
      amountOut,
      valueUSD: resolveValueUSD(tx),
      protocol: (tx.protocol_name as string | undefined) || undefined,
      txHash: extractHash(tx)
    };
  });
};

const isTokenMatch = (token: string | undefined, canonical: keyof typeof TOKEN_NORMALIZATION) => {
  if (!token) return false;
  const normalized = normalizeTokenSymbol(token);
  if (!normalized) return false;
  return normalized === canonical || TOKEN_NORMALIZATION[canonical].includes(normalized.toLowerCase());
};

export const extractUsdcToWbtcSwaps = (
  txs: NormalizedTransaction[]
): NormalizedTransaction[] => {
  return txs.filter(
    (tx) => tx.type === 'swap' && isTokenMatch(tx.tokenIn, 'USDC') && isTokenMatch(tx.tokenOut, 'WBTC')
  );
};
