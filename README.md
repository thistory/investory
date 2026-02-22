# Investory

[한국어](README_ko.md)

In-depth US stock analysis and investment scoring platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 3.4, next-themes
- **State**: TanStack Query (server), Zustand (client)
- **Charts**: Lightweight Charts (TradingView), Recharts
- **Cache**: Redis (ioredis)
- **API**: Finnhub, Alpha Vantage

## Local Development

```bash
npm install
cp .env.example .env   # Set your API keys
npm run dev            # http://localhost:3000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/analysis` | Daily analysis report list |
| `/stock/{SYMBOL}` | Stock detail (quote, score, chart) |
| `/stock/{SYMBOL}/analysis` | Per-stock analysis history |
| `/stock/{SYMBOL}/analysis/{date}` | Individual analysis report |
| `/compare?symbols=A,B` | Stock comparison |
| `/api/analysis/telegram` | Telegram report API |

## Project Structure

```
src/
├── app/              # Pages & API routes
├── components/       # UI, chart, stock, screener
├── lib/              # Services, scoring, cache
├── hooks/            # Custom hooks
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── data/analysis/    # Analysis report types & loaders
data/analysis/reports/ # Per-stock analysis JSON (auto-scanned)
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md)
