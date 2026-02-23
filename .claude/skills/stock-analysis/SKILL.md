---
name: stock-analysis
description: In-depth US stock analysis. Given a ticker, researches and compiles business model, financials, growth drivers, risks, and buy thesis in an easy-to-understand format. Auto-triggered on stock analysis requests.
argument-hint: "[TICKER] (e.g., AAPL, TSLA, NVDA)"
allowed-tools: WebSearch, WebFetch, Read, Write, Bash, Task, Grep, Glob
---

# US Stock In-Depth Analysis Skill

When the user provides a US stock ticker, produce an analysis report written at a level **beginner investors can easily understand**.

## Input

- `$ARGUMENTS`: Ticker symbol to analyze (e.g., AAPL, NVDA, TSLA)
- If no ticker is provided, ask the user

## Output Format

Each ticker produces **4 deliverables** across 2 JSON files:

| # | Deliverable | File | Field |
|---|-------------|------|-------|
| 1 | Korean analysis report | `{SYMBOL}/{YYYY-MM-DD}.json` | Top-level fields |
| 2 | Korean SNS content | `{SYMBOL}/{YYYY-MM-DD}.json` | `snsContent` |
| 3 | English analysis report | `{SYMBOL}/{YYYY-MM-DD}.en.json` | Top-level fields |
| 4 | English SNS content | `{SYMBOL}/{YYYY-MM-DD}.en.json` | `snsContent` |

- Base path: `data/analysis/reports/`
- JSON schema: follows the `StockAnalysisReport` interface in `src/data/analysis/types.ts`
- The server auto-scans `data/analysis/reports/`, so no manual registration is needed
- **All 4 deliverables must be present before the ticker is considered complete.**

## Analysis Process

### Multi-Ticker Analysis (2+ tickers)

**Launch 1 background agent per ticker simultaneously.** 5 tickers = 5 agents running fully in parallel.

Each agent uses `model: "sonnet"`, `run_in_background: true`, and independently executes the **single-ticker pipeline** below:

```
Main agent → Launch N background agents concurrently (1 per ticker)
           → Each agent completes data collection + Korean JSON + English JSON + SNS
           → Main agent only checks results after all finish
```

Each background agent prompt **must include**:
- Ticker symbol and today's date
- Existing report file path if available (so the agent reads it directly)
- Full "JSON Report Structure" section from this SKILL
- Korean + English writing guidelines
- SNS content format (X, Threads)
- Output file paths: `data/analysis/reports/{SYMBOL}/{date}.json`, `{date}.en.json`

### Single-Ticker Pipeline (flow each agent follows)

#### Step 1: Data Collection

**If an existing report exists** (update):
- Read the existing report and **reuse businessSummary, growthDrivers, competitiveAdvantage as-is**
- **Search only for changed data**: price, news, analyst opinions, technical indicators, financial metrics
- 3-5 searches are sufficient

**If no existing report** (new):
- Full data search: basic info + financials + news + analysts + technical indicators
- 6-8 searches

#### Step 2: Write Korean JSON Report

Write the Korean `.json` report from collected data.

#### Step 3: Generate English JSON + SNS Content

Immediately after the Korean report is complete, **within the same agent**, sequentially:
1. Write the English `.en.json` report (translate from Korean, include snsContent)
2. Add snsContent to the Korean `.json` (use Edit tool to insert before the final `}`)

Processing English and SNS **sequentially within one agent** prevents race conditions.

### JSON Report Structure

Write collected data as JSON in the following structure:

```jsonc
{
  // Basic info
  "symbol": "BMNR",
  "companyName": "Bitmine Immersion Technologies",
  "analysisDate": "2026-02-18",    // today's date
  "currentPrice": 20.96,
  "marketCap": "$9.5B",

  // Company description (rarely changes)
  "businessSummary": {
    "oneLiner": "One-line description",
    "description": "Detailed description (beginner-friendly)",
    "howTheyMakeMoney": ["Revenue source 1", "Revenue source 2"],
    "keyProducts": ["Product 1", "Product 2"]
  },

  // Key metrics (around 6)
  "keyMetrics": [
    { "name": "P/E (Price-to-Earnings)", "value": "373x", "interpretation": "Interpretation" }
  ],

  // Growth drivers
  "growthDrivers": [
    { "title": "Title", "description": "Description" }
  ],

  // Competitive advantage
  "competitiveAdvantage": {
    "summary": "Summary",
    "moats": [{ "type": "Type", "description": "Description" }],
    "competitors": [{ "name": "Competitor", "detail": "Detail" }]
  },

  // Recent news (5 items, newest first)
  "recentNews": [
    { "date": "2026-02-16", "headline": "Headline", "significance": "Significance", "url": "https://..." }
  ],

  // Analyst opinions
  "analystOpinions": {
    "consensusTarget": 43.0,
    "highTarget": 47.0,
    "lowTarget": 39.0,
    "upsidePercent": 105,
    "buyCount": 2,
    "holdCount": 0,
    "sellCount": 0,
    "notableComment": "Notable comment"
  },

  // Risks (severity: "critical" | "high" | "medium" | "low")
  "risks": [
    { "severity": "critical", "title": "Title", "description": "Description" }
  ],

  // Buy reasons
  "buyReasons": [
    { "title": "Title", "rationale": "Rationale" }
  ],

  // Technical position
  "technicalPosition": {
    "week52High": 161.0,
    "week52Low": 3.2,
    "currentPositionPercent": 11.3,
    "sma50": 31.35,
    "sma50Signal": "below",       // "above" | "below"
    "sma200": 32.0,
    "sma200Signal": "below",      // "above" | "below"
    "rsi": 42.72,
    "rsiSignal": "neutral"        // "oversold" | "overbought" | "neutral"
  },

  // Overall opinion (bullet-point list, 3-5 items)
  "overallOpinion": [
    "Point 1",
    "Point 2",
    "Point 3"
  ],

  // Sources (minimum 8)
  "sources": [
    { "name": "Source name", "url": "https://...", "description": "Description" }
  ]
}
```

### SNS Content Format

Add an `snsContent` field to the report JSON. **X (Twitter) is the base format**; Threads is a slight variation of X.

#### SNS Writing Style

**키워드 나열 금지. 짧은 문장으로 써라.**

Bad (키워드 나열):
```
- Baird Outperform $548 업그레이드
- FSD 네덜란드 EU 승인 획득
```

Good (읽기 쉬운 문장):
```
- Baird가 Outperform으로 업그레이드하며 목표가 $548 제시
- FSD가 네덜란드에서 EU 승인을 획득, 유럽 확장 발판
```

**em dash (`—`) 절대 금지.** 콤마(`,`), 마침표(`.`), 괄호(`()`), 콜론(`:`)으로 대체.

#### Korean SNS (`.json`)

##### X (Twitter) Base Format

```
오늘의투자 {SYMBOL} ({M/D})
- {핵심 포인트를 짧은 문장으로}
- {수치와 맥락을 함께 설명}
- {누가 뭘 했는지 명확하게}

⚠️ {리스크를 문장으로 설명}
핵심: {가장 중요한 변수}

평균 목표가 ${avg target} (현재가 ${current price} 대비 +{upside}%)
{밸류에이션 지표 1} · {지표 2}

{종합 의견에서 한줄 요약}
```

> **Note:** Do NOT include links like `상세 분석 👉 investory.kro.kr` in snsContent. The share button automatically appends the current page URL.

#### English SNS (`.en.json`)

##### X (Twitter) Base Format

```
{SYMBOL} Daily Recap, {Mon D}
- {Write each point as a short, readable sentence}
- {Include numbers with context, not just raw data}
- {Make it clear who did what}

⚠️ {Explain the risk in a sentence}
Key: {Most important variable}

Avg Target ${target} (vs current ${price}, +{upside}%)
{Valuation metric 1} · {Metric 2}

{One-line summary from overall opinion}
```

> **Note:** Do NOT include `Full analysis 👉 investory.kro.kr/en` in snsContent. The share button automatically appends the page URL.

#### Platform Variation Rules

| Platform | Field | Length | Difference from X |
|----------|-------|--------|-------------------|
| X | `snsContent.x` | hook 50 chars, text under 280 chars | Use base format as-is |
| Threads | `snsContent.threads` | hook 50 chars, text under 280 chars | Slightly more casual tone, add 1-2 emojis |

**All platforms:** Write in short, readable sentences. No keyword dumps. No em dashes.

#### Tone Variants (`snsContent.tones`)

Generate 4 tone variants for both X and Threads. Each tone set lives under `snsContent.tones.x` and `snsContent.tones.threads`.

```jsonc
"snsContent": {
  "x": { "hook": "...", "text": "..." },        // default (same as fact tone)
  "threads": { "hook": "...", "text": "..." },   // default (same as fact tone)
  "telegram": { "hook": "...", "text": "..." },
  "tones": {
    "x": {
      "fact":    { "hook": "...", "text": "..." },
      "witty":   { "hook": "...", "text": "..." },
      "smart":   { "hook": "...", "text": "..." },
      "empathy": { "hook": "...", "text": "..." }
    },
    "threads": {
      "fact":    { "hook": "...", "text": "..." },
      "witty":   { "hook": "...", "text": "..." },
      "smart":   { "hook": "...", "text": "..." },
      "empathy": { "hook": "...", "text": "..." }
    }
  }
}
```

| Tone Key | Korean Label | English Label | Icon | Guidelines |
|----------|-------------|---------------|------|------------|
| `fact` | 팩트정리 | Facts | 📊 | Same as the default X/Threads format. Bullet-point data summary. |
| `witty` | 재밌게 | Witty | 😂 | Humor, memes, metaphors. Use trending slang or pop culture references. Make numbers entertaining ("목표가까지 로켓 발사 대기중 🚀"). Keep factual accuracy. |
| `smart` | 똑똑하게 | Smart | 🧠 | Analytical insight tone. Lead with a non-obvious conclusion. Use "because/therefore" logic chains. Sound like a sharp analyst friend explaining over coffee. |
| `empathy` | 공감형 | Relatable | 💬 | Retail investor psychology. Start with a relatable question or feeling ("이 종목 들고 있으면 요즘 마음이 복잡하죠?"). Acknowledge uncertainty. End with encouragement or a clear takeaway. |

**Rules for all tones:**
- Same character limits as the base format (X: 280 chars, Threads: 280 chars)
- `fact` tone text must be identical to the default `snsContent.x` / `snsContent.threads` text
- All tones must contain the same core data points (price, target, upside %)
- No links in tone text (the share button appends the URL automatically)
- Each `hook` should be tone-appropriate (witty hook should be funny, smart hook insightful, etc.)

## Writing Guidelines

### General

- **No em dashes (`—`)**: Do not use em dashes anywhere in report text, snsContent, or any other output. Use commas (`,`), periods (`.`), parentheses (`()`), or colons (`:`) instead.

### Korean Report (.json)

1. **Write in plain language**: Beginner investors should understand everything. Add simple explanations for technical terms.
2. **Data-driven**: Back claims with data and numbers, not subjective opinions.
3. **Balanced perspective**: Don't just list positives; address risks honestly.
4. **Comparative view**: Compare with industry peers when possible.
5. **Latest data**: Always verify the most recent data via WebSearch.
6. **Cite sources**: Include sources for all figures in the sources array. Minimum 8 sources.
7. **Korean language**: All text in Korean. Keep proper nouns (company names, product names) in English.

### English Report (.en.json)

1. **US financial media style**: Bloomberg/WSJ/CNBC tone. Professional yet accessible to individual investors.
2. **Same data, different language**: Same figures, sources, and analysis as the Korean report, written in English.
3. **Natural English**: Do not translate literally from Korean. Write as a native speaker would.
4. **Metric names in English**: "P/E Ratio", "Revenue Growth (YoY)", "Operating Margin", etc.
5. **Source descriptions in English**: Same URLs, but descriptions in English.
6. **SNS content in English**: Do not use Korean terms like "오늘의투자". Use natural English expressions.

## Updating Existing Reports

If a previous report exists for the same ticker, read the most recent `.json` file from `data/analysis/reports/{SYMBOL}/` and:
- **Update only changed sections** (news, price, analyst opinions, technical position, keyMetrics, etc.)
- **Reuse unchanged base info** (businessSummary, growthDrivers, competitiveAdvantage, etc.)
- **Never reuse snsContent**: Always regenerate with the latest data
- This approach requires only 3-5 searches, significantly reducing processing time

## Search Strategy

- `"{ticker} stock analysis 2026"`: Latest analysis
- `"{ticker} earnings Q4 2025"`: Most recent quarterly results
- `"{ticker} analyst price target"`: Analyst targets
- `"{company name} news {current month}"`: Recent news
- `"stockanalysis.com {ticker}"`: Comprehensive financial metrics
- `"marketbeat.com {ticker} forecast"`: Analyst consensus
- `"investing.com {ticker} technical"`: Technical indicators

## Auto-Register to Homepage

After analysis is complete, automatically add the ticker to the homepage "Featured Stocks" list if not already present.

1. Read `data/stocks/managed-stocks.json` and check if the symbol exists
2. If not found, call `POST /api/stocks` (body: `{ "symbol": "{ticker}" }`) to add it
   - This API auto-fetches company name/logo/sector from Finnhub and saves to file + cache
   - If the dev server is down, directly add an entry to `data/stocks/managed-stocks.json`:
     `{ "symbol": "{ticker}", "name": "{company name}", "tag": "{sector}", "logo": "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/{ticker}.png", "addedAt": "{today's date}" }`
3. If already present, do nothing
