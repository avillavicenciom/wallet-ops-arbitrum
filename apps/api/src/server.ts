import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { normalizeTransactions, RawMoralisTransaction } from '@wallet-ops-arbitrum/core';

dotenv.config();

const app = express();
app.use(cors());

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { timestamp: number; payload: unknown }>();

const buildCacheKey = (address: string, cursor?: string | null) =>
  `${address.toLowerCase()}:${cursor || 'start'}`;

const getFromCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  const isFresh = Date.now() - entry.timestamp < CACHE_TTL_MS;
  return isFresh ? entry.payload : null;
};

const storeInCache = (key: string, payload: unknown) => {
  cache.set(key, { timestamp: Date.now(), payload });
};

app.get('/history', async (req, res) => {
  const address = String(req.query.address || '').trim();
  const cursor = (req.query.cursor as string | undefined) || undefined;

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MORALIS_API_KEY is not configured' });
  }

  const cacheKey = buildCacheKey(address, cursor);
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...((cached as object) || {}) });
  }

  try {
    const url = `${MORALIS_BASE_URL}/wallets/${address}/history`;
    const response = await axios.get(url, {
      headers: {
        'X-API-Key': apiKey
      },
      params: {
        chain: 'arbitrum',
        cursor
      }
    });

    const rawTxs: RawMoralisTransaction[] =
      (response.data?.result as RawMoralisTransaction[]) ||
      (response.data?.transactions as RawMoralisTransaction[]) ||
      [];

    const normalized = normalizeTransactions(rawTxs);

    const payload = {
      cursor: response.data?.cursor ?? null,
      total: response.data?.total ?? rawTxs.length,
      items: normalized
    };

    storeInCache(cacheKey, payload);

    return res.json(payload);
  } catch (error: unknown) {
    console.error('Failed to fetch history', error);
    const status = axios.isAxiosError(error) ? error.response?.status || 500 : 500;
    return res.status(status).json({ error: 'Unable to fetch wallet history' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
