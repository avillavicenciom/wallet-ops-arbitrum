'use client';

import { FormEvent, useMemo, useState } from 'react';
import { NormalizedTransaction, extractUsdcToWbtcSwaps } from '@wallet-ops-arbitrum/core';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const OPERATION_TYPES: Record<string, string> = {
  all: 'Todos',
  swap: 'Swap',
  transfer: 'Transfer',
  approve: 'Approve',
  borrow: 'Borrow',
  repay: 'Repay',
  liquidity: 'Liquidity'
};

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function Home() {
  const [address, setAddress] = useState('');
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [tokenFilter, setTokenFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [onlyUsdcWbtc, setOnlyUsdcWbtc] = useState(false);

  const fetchHistory = async (cursor?: string | null, append = false) => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/history`);
      url.searchParams.append('address', address);
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('No se pudo obtener el historial');
      }
      const data = await response.json();
      setTransactions((prev) => (append ? [...prev, ...data.items] : data.items));
      setNextCursor(data.cursor || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    fetchHistory();
  };

  const filteredTransactions = useMemo(() => {
    const base = onlyUsdcWbtc ? extractUsdcToWbtcSwaps(transactions) : transactions;
    return base.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      const matchesToken = tokenFilter
        ? [tx.tokenIn, tx.tokenOut].some((token) => token?.toLowerCase().includes(tokenFilter.toLowerCase()))
        : true;
      if (!matchesToken) return false;
      const timestamp = new Date(tx.timestampISO).getTime();
      if (dateFrom && timestamp < new Date(dateFrom).getTime()) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (timestamp > end.getTime()) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, tokenFilter, dateFrom, dateTo, onlyUsdcWbtc]);

  return (
    <main className="space-y-6">
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Wallet (Arbitrum)</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                placeholder="0x..."
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Token</span>
              <input
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
                placeholder="USDC, WBTC, ETH..."
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Tipo</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              >
                {Object.entries(OPERATION_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Desde</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Hasta</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={onlyUsdcWbtc}
                onChange={(e) => setOnlyUsdcWbtc(e.target.checked)}
              />
              Solo USDC → WBTC
            </label>
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 transition px-4 py-2 rounded-lg text-white font-medium"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Buscar'}
            </button>
            {nextCursor && (
              <button
                type="button"
                onClick={() => fetchHistory(nextCursor, true)}
                className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-slate-100"
                disabled={loading}
              >
                Cargar más
              </button>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Historial</h2>
          <p className="text-slate-400 text-sm">{filteredTransactions.length} operaciones</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-300">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Token In</th>
                <th className="py-2 pr-4">Monto In</th>
                <th className="py-2 pr-4">Token Out</th>
                <th className="py-2 pr-4">Monto Out</th>
                <th className="py-2 pr-4">USD</th>
                <th className="py-2 pr-4">Protocolo</th>
                <th className="py-2 pr-4">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.map((tx) => (
                <tr key={tx.txHash} className="hover:bg-slate-800/70">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(tx.timestampISO)}</td>
                  <td className="py-2 pr-4 uppercase text-xs font-semibold text-indigo-200">{tx.type}</td>
                  <td className="py-2 pr-4">{tx.tokenIn || '-'}</td>
                  <td className="py-2 pr-4">{tx.amountIn || '-'}</td>
                  <td className="py-2 pr-4">{tx.tokenOut || '-'}</td>
                  <td className="py-2 pr-4">{tx.amountOut || '-'}</td>
                  <td className="py-2 pr-4">{tx.valueUSD ? `$${tx.valueUSD.toLocaleString()}` : '-'}</td>
                  <td className="py-2 pr-4">{tx.protocol || '-'}</td>
                  <td className="py-2 pr-4">
                    <a
                      href={`https://arbiscan.io/tx/${tx.txHash}`}
                      className="text-indigo-300 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
              {!filteredTransactions.length && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-6">
                    No hay transacciones para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
