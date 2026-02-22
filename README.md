<div align="center">

# Investory

### *Invest + Story = Investory*

**Every stock has a story. We help you read it.**

Investory turns raw market data into clear, actionable investment stories — scoring stocks across 5 key pillars so you can make informed decisions, not emotional ones.

[![Live Demo](https://img.shields.io/badge/Live-investory.kro.kr-blue?style=for-the-badge)](https://investory.kro.kr)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[한국어](README_ko.md)

</div>

---

## What is Investory?

Most stock screeners throw numbers at you. Investory tells you what they **mean**.

We built a **5-Pillar Scoring System** that evaluates every stock across the dimensions that matter most to long-term investors:

| Pillar | Weight | What It Measures |
|--------|--------|------------------|
| **Quality** | 30% | Profitability, financial health, earnings consistency |
| **Moat** | 25% | Pricing power, market position, competitive durability |
| **Value** | 20% | Valuation multiples, margin of safety, price position |
| **Growth** | 15% | Historical growth, analyst expectations, growth quality |
| **Momentum** | 10% | Price trend, technical indicators, volume signals |

Each stock receives a final grade (**A+ to F**) with clear, human-readable insights — not just numbers.

## Features

- **Investment Score Cards** — 5-pillar breakdown with actionable insights per stock
- **Daily Analysis Reports** — AI-generated narratives covering business model, growth drivers, and risks
- **Real-time Quotes** — Live prices powered by Finnhub
- **Interactive Charts** — TradingView candlestick charts + Recharts financial visualizations
- **Stock Comparison** — Side-by-side multi-stock analysis
- **Technical Indicators** — RSI, MACD, Bollinger Bands, moving averages
- **Valuation Metrics** — P/E, P/B, P/S, EV/EBITDA with sector benchmarks
- **Dark / Light Mode** — Full theme support
- **Bilingual** — English and Korean (ko/en)
- **Mobile-first** — Responsive design for all screen sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 3.4, next-themes |
| State | TanStack Query (server), Zustand (client) |
| Charts | Lightweight Charts (TradingView), Recharts |
| Auth | Auth.js v5 (Google OIDC), JWT sessions |
| Database | Neon PostgreSQL (serverless), Drizzle ORM |
| Cache | Redis (ioredis) |
| i18n | next-intl (ko/en) |
| Data | Finnhub, Alpha Vantage |

## Getting Started

### Prerequisites

- Node.js 18+
- Redis (optional, for caching)
- API keys: [Finnhub](https://finnhub.io/) and [Alpha Vantage](https://www.alphavantage.co/)

### Installation

```bash
git clone https://github.com/thistory/investory.git
cd investory
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Data APIs
FINNHUB_API_KEY=your_finnhub_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Auth (Google OAuth)
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Database
DATABASE_URL=your_neon_database_url

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/              # Pages & API routes (App Router)
├── components/       # UI, chart, stock, and layout components
│   ├── layout/       # Navbar, LocaleSwitcher
│   ├── stock/        # ScoreCard, PriceChart, AnalysisReport, ...
│   └── ui/           # Shared UI primitives
├── lib/              # Services, scoring engine, cache, auth
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── i18n/             # Internationalization config
└── data/analysis/    # Analysis report types & loaders

data/analysis/reports/ # Per-stock analysis JSON (auto-scanned)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |

## Contributing

Contributions are welcome! Whether it's a bug fix, new feature, or improvement to the scoring algorithm — we'd love your help.

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feat/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feat/amazing-feature`)
5. **Open** a Pull Request

### Ideas for Contribution

- Add new data sources (SEC filings, earnings transcripts, ...)
- Improve the scoring algorithm with more sophisticated metrics
- Add new languages beyond English and Korean
- Build a stock screener with custom filters
- Add portfolio tracking features
- Improve accessibility (a11y)
- Write tests

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[investory.kro.kr](https://investory.kro.kr)**

Built with curiosity about markets and code.

</div>
