import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Wallet Ops Arbitrum',
  description: 'Explora operaciones on-chain en Arbitrum con énfasis en swaps USDC → WBTC'
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold">Wallet Ops Arbitrum</h1>
            <p className="text-slate-300">Visualiza el historial de transacciones y detecta swaps USDC → WBTC.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
