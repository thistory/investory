---
name: stock-analysis
description: In-depth US stock analysis. Given a ticker, researches and compiles business model, financials, growth drivers, risks, and buy thesis in an easy-to-understand format. Auto-triggered on stock analysis requests.
argument-hint: "[TICKER] (e.g., AAPL, TSLA, NVDA)"
allowed-tools: WebSearch, WebFetch, Read, Write, Edit, Bash, Task, Grep, Glob
---

# US Stock Analysis Skill

Produce a beginner-friendly analysis report for the given ticker(s).

## Input/Output

- Input: `$ARGUMENTS` = ticker symbol(s) (e.g., TSLA, NVDA PLTR)
- Output: `data/analysis/reports/{SYMBOL}/{YYYY-MM-DD}.json` (Korean) + `.en.json` (English)
- Schema: `src/data/analysis/types.ts` → `StockAnalysisReport`
- Ref files (read only when needed): `.claude/skills/stock-analysis/refs/json-schema.md`, `refs/sns-format.md`

## 3-Phase Pipeline: Code → LLM → Code

### Phase 1: Data Collection (CODE)

Run the data fetcher to get price, technicals, SMA, RSI without web searches:

```bash
node scripts/fetch-stock-data.js {SYMBOL}
```

Output: `.cache/analysis/{SYMBOL}.json` — structured data the LLM can reference.

Also read the most recent existing report: `data/analysis/reports/{SYMBOL}/` (latest `.json` file).

### Phase 2: Analysis (LLM)

**What LLM does:** Only creative/analytical work that code cannot do.

#### Update case (previous report exists) — 2-3 web searches max

1. Read `.cache/analysis/{SYMBOL}.json` (pre-fetched data)
2. Read previous report (reuse: businessSummary, growthDrivers, competitiveAdvantage)
3. Web search for: recent news + analyst opinion changes only (2-3 searches)
4. Write Korean `.json`: update recentNews, keyMetrics, risks, buyReasons, overallOpinion, investmentVerdict, analystOpinions
5. Keep technicalPosition from cached data (Phase 1 already computed it)

#### New ticker case — 4-6 web searches max

1. Read `.cache/analysis/{SYMBOL}.json`
2. Read `refs/json-schema.md` for full field reference
3. Web search: company overview + financials + news + analysts (4-6 searches)
4. Write full Korean `.json`

#### SNS Content (within same step)

Read `refs/sns-format.md`, then generate snsContent for the Korean report.
**Do NOT generate fact tone** — the finalize script copies base SNS as fact automatically.
Generate only: base (x, threads, telegram) + witty + empathy tones.

#### English Report

Use `model: "haiku"` for translation. The agent prompt:
- Include the full Korean report JSON
- Instruct: "Translate to natural English (Bloomberg/WSJ tone). Same data, no literal translation. SNS content in English too. Do not generate fact tone."
- Output: `{date}.en.json`

### Phase 3: Finalization (CODE)

After both JSON files exist, run:

```bash
node scripts/finalize-report.js {SYMBOL} {YYYY-MM-DD}
```

This script:
1. Merges cached stock data (price, technicals) into both reports
2. Copies base SNS → `tones.*.fact` (no LLM needed)
3. Updates index files (`index.json`, `index.en.json`)

## Multi-Ticker (2+ tickers)

```
Phase 1: node scripts/fetch-stock-data.js TSLA NVDA PLTR  (one call, all tickers)
Phase 2: Launch 1 background agent per ticker (model: "sonnet", run_in_background: true)
         Each agent does: read cache + read prev report + 2-3 searches + write ko JSON + SNS
         Then launches haiku sub-agent for English translation
Phase 3: After all agents complete: node scripts/finalize-report.js {SYM} {DATE} for each
```

Each background agent prompt must include:
- Ticker, today's date, cached data path, previous report path
- "Read `refs/json-schema.md` for schema" (NOT the schema itself — agent reads the file)
- "Read `refs/sns-format.md` for SNS format" (NOT inline)
- Output file paths

## Writing Rules

- **No em dashes (`—`) or interpuncts (`·`)** anywhere. Use commas, periods, parentheses, colons.
- **Korean**: Plain language, beginner-friendly, data-driven, balanced. Proper nouns in English.
- **English**: Bloomberg/WSJ tone. Natural English, not literal translation.
- **P/E comparison required**: Always include sector avg, S&P 500 avg, or competitor P/E for context.
- **overallOpinion**: 3-4 items, 350-400 chars total (Korean). Events/catalysts first, technicals last. Full sentences, no jargon.
- **Sources**: Minimum 8, with URLs.

## Search Strategy

- `"{ticker} news {current month} {year}"`: Recent news
- `"{ticker} analyst price target {year}"`: Analyst targets
- `"stockanalysis.com {ticker}"`: Financial metrics
- `"marketbeat.com {ticker} forecast"`: Analyst consensus
