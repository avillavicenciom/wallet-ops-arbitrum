# Wallet Ops Arbitrum

Aplicación full-stack en TypeScript para consultar el historial de una wallet en Arbitrum, normalizar las transacciones y destacar los swaps **USDC → WBTC**.

## Estructura del monorepo
- `apps/api`: API REST (Express) que consulta Moralis Wallet History API y normaliza los datos.
- `apps/web`: Frontend Next.js para buscar una wallet, filtrar operaciones y ver detalles.
- `packages/core`: Lógica compartida para detección y normalización de transacciones.

## Requisitos
- Node.js 18+
- Una API Key de Moralis con acceso al Wallet History API.

## Configuración
1. Clona el repositorio y entra en la carpeta.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo de entorno y coloca tu API key:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y asigna `MORALIS_API_KEY`. Si cambias el puerto del API, actualiza también `NEXT_PUBLIC_API_BASE_URL`.

## Scripts disponibles
- `npm run dev`: levanta el API y el frontend en paralelo.
- `npm run lint`: valida los proyectos con TypeScript/ESLint.
- `npm run test`: ejecuta los tests unitarios del core.

También puedes ejecutar cada paquete individualmente:

```bash
npm --workspace apps/api run dev     # API en http://localhost:4000
npm --workspace apps/web run dev     # Frontend en http://localhost:3000
```

## API
- **GET** `/history?address=0x...&cursor=...`
  - Llama a Moralis Wallet History API en Arbitrum.
  - Responde con transacciones normalizadas en el formato:
    ```json
    {
      "timestampISO": "2024-05-14T12:00:00.000Z",
      "type": "swap",
      "tokenIn": "USDC",
      "amountIn": "1500",
      "tokenOut": "WBTC",
      "amountOut": "0.025",
      "valueUSD": 1500,
      "protocol": "Uniswap V3",
      "txHash": "0x..."
    }
    ```
  - Incluye cache simple en memoria por dirección y cursor (TTL: 60s).

## Frontend
- Input de wallet (Arbitrum) y botón de búsqueda.
- Tabla cronológica con link a Arbiscan.
- Filtros por tipo de operación, token, rango de fechas y toggle "Solo USDC → WBTC".
- Paginación mediante el cursor devuelto por la API.

## Núcleo de detección
`packages/core` expone:
- `normalizeTransactions(rawTxs)`
- `detectOperationType(tx)`
- `extractUsdcToWbtcSwaps(txs)`

Los tests usan fixtures reales simplificadas para validar la detección de swaps USDC → WBTC y la clasificación de operaciones.
