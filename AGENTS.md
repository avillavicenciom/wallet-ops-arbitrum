# Codex Agent Instructions

Objetivo del repositorio:
Construir una web app que lea una wallet en Arbitrum y muestre todas las operaciones
de forma clara para humanos, con foco especial en swaps USDC -> WBTC.

Requisitos clave:
- Backend y frontend separados (API + Web)
- No exponer API keys en frontend
- Normalizar datos on-chain
- Clasificar operaciones:
  - swap
  - transfer
  - approve
  - borrow
  - repay
  - add/remove liquidity
- Detectar swaps USDC -> WBTC con fecha, hora y montos exactos

Stack preferido:
- TypeScript
- Node.js
- Next.js para frontend
- API REST simple
- Tests unitarios para la lógica de detección de swaps

Criterios de calidad:
- Código limpio y tipado
- README claro
- Proyecto runnable en local
