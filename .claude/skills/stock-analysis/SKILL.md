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

  // Overall opinion (bullet-point list, 3-4 items, TOTAL 350-400 chars in Korean)
  // CONCISE: each point is 1 sentence with key numbers. No filler, no repetition.
  // Order: catalysts/events/macro FIRST → price/technicals LAST
  //   Top: news, key events, catalysts, bull/bear cases, macro impact, company events
  //   Bottom: price levels, valuation metrics, technical analysis (SMA, RSI, etc.)
  "overallOpinion": [
    "핵심 이벤트/카탈리스트 + 수치 (1문장)",
    "호재 또는 악재 요약 + 수치 (1문장)",
    "가격, 밸류에이션, 기술적 포지션 (항상 마지막, 1문장)"
  ],

  // Sources (minimum 8)
  "sources": [
    { "name": "Source name", "url": "https://...", "description": "Description" }
  ]
}
```

### SNS Content Format

Add an `snsContent` field to the report JSON. **X (Twitter) uses a thread format**; Threads is a single-post variation.

#### SNS Writing Style — Voice & Tone

**SNS답게, 사람이 쓴 것처럼 써라.** 분석 리포트를 복붙한 것 같으면 안 된다.

- **너무 딱딱하면 안 됨**: 보고서 톤("~로 분석됨", "~것으로 사료됨") 금지. 자연스러운 구어체로.
- **너무 가볍거나 튀면 안 됨**: 과한 이모지, 밈, 유행어, 감탄사("대박!", "미쳤다!") 금지. 절제된 톤.
- **적정 온도**: 투자 커뮤니티에서 신뢰받는 사람이 쓰는 느낌. 데이터는 정확하게, 표현은 편하게.
- **읽는 속도 고려**: 한 문장은 30자 내외. 긴 문장보다 짧은 문장 여러 개가 낫다.
- **주어 명확히**: "업그레이드됐다"(X) → "Baird가 업그레이드했다"(O)

**키워드 나열 금지. 짧은 문장으로 써라.**

Bad (키워드 나열):
```
- Baird Outperform $548 업그레이드
- FSD 네덜란드 EU 승인 획득
```

Good (읽기 쉬운 문장):
```
- Baird가 Outperform으로 올리면서 목표가 $548 제시
- FSD가 네덜란드에서 EU 승인을 땄다. 유럽 확장의 발판
```

**em dash (`—`), 가운뎃점(`·`) 절대 금지.** 콤마(`,`), 마침표(`.`), 괄호(`()`), 콜론(`:`)으로 대체. 항목 나열 시 `·` 대신 콤마(`,`)를 사용하라.

#### SNS Content Quality Guidelines

**`overallOpinion`을 바탕으로, SNS 글 성격에 맞게 재구성하라.**

snsContent는 별도로 창작하는 것이 아니라, **`overallOpinion` 필드의 내용을 SNS 톤으로 변환**한 것이어야 한다. overallOpinion의 핵심 포인트, 수치, 맥락을 그대로 살리되, SNS에서 읽히는 문체로 바꿔라.

1. **Source: overallOpinion**: snsContent의 본문은 반드시 `overallOpinion`의 핵심 포인트들을 기반으로 작성하라. 새로운 내용을 추가하거나 overallOpinion에 없는 관점을 넣지 마라. overallOpinion의 순서(뉴스/이벤트/카탈리스트 → 가격/기술적 분석)를 그대로 따라라.
2. **Adapt, don't copy**: overallOpinion을 그대로 복붙하지 마라. SNS에 맞게 문체를 바꿔라. 딱딱한 분석 톤 → 짧고 임팩트 있는 문장, 불릿 포인트 활용, 핵심 수치 강조.
3. **Keep the substance**: 톤은 바꾸되 내용의 깊이는 유지하라. overallOpinion에 있는 수치(목표가, P/E, 이평선 등), 카탈리스트, 리스크를 빠뜨리지 마라.
4. **Engagement layer**: overallOpinion의 내용 위에 SNS적 요소를 입혀라. 질문형 마무리, 대비/아이러니 활용 등.

> **English version of the same rules:**
> 1. **Source: overallOpinion**: The snsContent body must be based on the `overallOpinion` field's key points. Do not add new insights or perspectives absent from overallOpinion. Follow the same ordering (news/events/catalysts first, price/technicals last).
> 2. **Adapt, don't copy**: Don't paste overallOpinion verbatim. Rewrite in SNS-friendly style: shorter sentences, bullet points, emphasized key figures.
> 3. **Keep the substance**: Change the tone, not the depth. Retain all numbers (targets, P/E, SMAs), catalysts, and risks from overallOpinion.
> 4. **Engagement layer**: Layer SNS elements on top of overallOpinion content: closing questions, contrast/irony framing.

#### X (Twitter) Thread Format

X has a 280-character limit per tweet. **All X content (`snsContent.x` and tones) must use the thread format.**

- `text`: First tweet of the thread (MUST be <= 280 chars). This is the hook tweet that makes people stop scrolling.
- `thread`: Array of reply tweets (each MUST be <= 280 chars). These continue the analysis as a thread.

**Thread structure:**

| Tweet | Purpose | Content |
|-------|---------|---------|
| 1st (text) | Hook + headline | Ticker, date, the single most important takeaway. Make it punchy. |
| 2nd (thread[0]) | Key catalysts/events | The main news, upgrades, product launches |
| 3rd (thread[1]) | Risks/bears | Key risks, bear case, what could go wrong |
| Last (thread[N]) | Numbers + verdict | Price, target, P/E, technical levels, one-line summary |

**Thread writing rules:**
- Each tweet MUST be <= 280 chars. Count carefully. This is a hard limit.
- The first tweet should work standalone. If someone only sees tweet 1, they should get the core message.
- Use `\n` for line breaks within a tweet. Each tweet is a separate string.
- Typical thread length: 3-4 tweets. Max 5 tweets.
- Don't start reply tweets with `-` bullets. Use flowing sentences or short paragraphs.
- Don't number the tweets (1/, 2/, etc.). The thread structure handles ordering.

##### Korean X Thread Template

```
// text (first tweet, <= 280 chars):
"$TSLA (2/23) Baird가 목표가 $548로 올렸다. 그런데 로보택시는 또 5건 충돌. 강세파와 약세파가 완전히 갈렸다. 컨센서스 $480(+17%)"

// thread (reply tweets, each <= 280 chars):
[
  "FSD가 네덜란드에서 EU 첫 승인을 받았다. Cybercab 4월 양산 시작, 9개 도시 확대 예정. 유럽 진출의 실질적인 첫 발이다.",
  "리스크도 무겁다. 로보택시 추가 충돌 5건, Waymo $160억 조달로 경쟁 본격화. xAI 이해충돌 주주 소송까지 경영 리스크가 겹친다.",
  "종가 $411, P/E 407x, Forward P/E 210x\n50일선 $441 하회, 200일선 $388 지지 중\n4월 Cybercab 양산이 분수령"
]
```

##### English X Thread Template

```
// text (first tweet, <= 280 chars):
"$TSLA (Feb 23) Baird upgrades to $548 target. Meanwhile, 5 more robotaxi crashes reported. Bulls and bears couldn't be further apart. Consensus $480 (+17%)"

// thread (reply tweets, each <= 280 chars):
[
  "FSD just got EU approval in the Netherlands. Cybercab mass production starts April, expanding to 9 cities. A real foothold in Europe.",
  "The risks are real too. 5 more robotaxi crashes, Waymo raising $16B to compete, and an xAI conflict-of-interest lawsuit adding governance risk.",
  "Close $411, P/E 407x, Fwd P/E 210x\nBelow 50-day SMA ($441), holding 200-day ($388)\nApril Cybercab ramp is the make-or-break moment"
]
```

> **Note:** Do NOT include links in snsContent. The share button automatically appends the page URL to the last tweet.

#### Threads Format

Threads has no character limit. Use a single `text` field (no `thread` array needed). Slightly more casual than X, can use 1-2 emojis. Write with `overallOpinion`-level depth.

#### Telegram Format

Same as before: single `text` field, structured with sections (price, key issues, technicals, etc.).

#### Platform Variation Rules

| Platform | Field | Format | Notes |
|----------|-------|--------|-------|
| X | `snsContent.x` | `text` (<=280) + `thread[]` (each <=280) | Thread format required |
| Threads | `snsContent.threads` | `text` (no limit) | Single post, slightly casual |
| Telegram | `snsContent.telegram` | `text` (no limit) | Structured with sections |

#### Tone Variants (`snsContent.tones`)

Generate 3 tone variants for both X and Threads. Each tone set lives under `snsContent.tones.x` and `snsContent.tones.threads`.

```jsonc
"snsContent": {
  "x": { "hook": "...", "text": "...", "thread": ["...", "..."] },  // default (same as fact tone)
  "threads": { "hook": "...", "text": "..." },                      // default (same as fact tone)
  "telegram": { "hook": "...", "text": "..." },
  "tones": {
    "x": {
      "fact":    { "hook": "...", "text": "...", "thread": ["...", "..."] },
      "witty":   { "hook": "...", "text": "...", "thread": ["...", "..."] },
      "empathy": { "hook": "...", "text": "...", "thread": ["...", "..."] }
    },
    "threads": {
      "fact":    { "hook": "...", "text": "..." },
      "witty":   { "hook": "...", "text": "..." },
      "empathy": { "hook": "...", "text": "..." }
    }
  }
}
```

| Tone Key | Korean Label | English Label | Icon | Guidelines |
|----------|-------------|---------------|------|------------|
| `fact` | 팩트정리 | Facts | 📊 | See **fact tone style** below |
| `witty` | 재밌게 | Witty | 😂 | See **witty tone style** below |
| `empathy` | 공감형 | Relatable | 💬 | See **empathy tone style** below |

##### fact tone style (팩트정리)

Factual summary with analytical insight baked in. **Don't just state the fact. Explain why it matters for investors.** Include actionable context: what it means for the stock, upcoming catalysts, valuation perspective. X format uses thread; Threads uses single post.

Korean X thread example:
```
text: "$TSLA (2/23) Baird가 목표가 $548 제시, 애널리스트 42%가 Buy 유지. 컨센서스 $480(+17%). 한편 로보택시 추가 충돌 5건 보고"
thread: [
  "FSD가 네덜란드에서 EU 첫 승인. Cybercab 4월 양산 시작으로 9개 도시 확대 예정. 핸들도 페달도 없는 완전 자율주행 차량이다.",
  "리스크: 로보택시 안전성 논란 재부각, Waymo $160억 조달로 경쟁 본격화. xAI 이해충돌 소송도 경영 리스크.",
  "종가 $411, P/E 407x, Forward P/E 210x\n목표가 $480(+17%)\n4월 Cybercab 양산과 Optimus v3 Q1 공개가 상반기 핵심"
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Baird sets $548 target, 42% of analysts rate Buy. Consensus $480 (+17%). But 5 more robotaxi crashes just reported."
thread: [
  "FSD gets EU approval in Netherlands. Cybercab mass production starts April across 9 cities. No steering wheel, no pedals.",
  "Risks: robotaxi safety concerns resurface. Waymo raises $16B to compete. xAI conflict-of-interest lawsuit adds governance risk.",
  "Close $411, P/E 407x, Fwd P/E 210x\nTarget $480 (+17%)\nApril Cybercab ramp and Q1 Optimus v3 unveil are key H1 catalysts"
]
```

##### witty tone style (재밌게)

Natural, conversational flow. Sentences should **connect to each other** like a story, not isolated jokes. Use humor through contrast and irony, not forced memes. Stay factually accurate. **Even with humor, include investment-useful information.** The reader should laugh AND learn something. X format uses thread.

Korean X thread example:
```
text: "$TSLA (2/23) Baird가 $548을 외치는 동안, 로보택시는 또 5번을 박았다. 아이러니하지만 이게 테슬라다."
thread: [
  "FSD가 네덜란드에서 EU 승인을 땄고, Cybercab은 4월에 핸들도 페달도 없이 출격한다. Waymo가 $160억 들고 쫓아오지만, 유럽은 테슬라가 먼저 발을 디뎠다.",
  "P/E 407배는 숫자가 아니라 믿음 체계다. 리테일 40%가 그 믿음에 동참 중이고, 빠질 때마다 오히려 더 사고 있다.",
  "종가 $411, 목표가 $480(+17%)\n4월 양산이 다음 심판의 날"
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Baird slaps a $548 target on Tesla while the robotaxis rack up 5 more crashes. The irony writes itself."
thread: [
  "FSD just got EU approval in the Netherlands. Cybercab rolls out in April with no steering wheel, no pedals. Waymo has $16B to chase, but Tesla got to Europe first.",
  "P/E at 407x isn't a valuation, it's a belief system. 40% retail ownership means a lot of believers buying every dip.",
  "Close $411, Target $480 (+17%)\nApril production is judgment day"
]
```

**Key:** Each sentence leads naturally into the next. The humor comes from juxtaposition (upgrade vs crash, no steering wheel), not from random emoji or slang. But even the jokes carry real data points the reader can use.

##### empathy tone style (공감형)

Write like talking to a friend who holds this stock. **Longer and more detailed than other tones.** Start by acknowledging the investor's current emotional state. Present both good and bad news honestly. End with a concrete upcoming catalyst and gentle encouragement. **Include specific numbers and context so the reader gets real investment value, not just emotional support.** X format uses thread (can have more tweets than other tones, up to 5).

Korean X thread example:
```
text: "$TSLA (2/23) 테슬라 들고 있으면 요즘 하루가 롤러코스터 같을 거다. 연초 대비 -9%, P/E 407배. 불안한 게 당연하다."
thread: [
  "좋은 소식부터. Baird가 $548로 업그레이드했고, 54명 애널리스트 중 42%가 Buy 유지. 중앙값 $480, 현재가 대비 +17%다. FSD도 네덜란드에서 EU 승인을 받았다.",
  "하지만 로보택시 추가 충돌 5건, Waymo $160억 조달로 경쟁 본격화. xAI 주주 소송까지. 불안한 마음이 드는 게 당연하다.",
  "그래도 혼자가 아니다. 리테일 40%가 함께 보유 중이고, 빠질 때마다 오히려 매수를 늘려왔다. 50일선($441) 아래지만 200일선($388)은 지키고 있다.",
  "4월 Cybercab 양산과 Optimus v3 Q1 공개가 다음 시험대다. 조금만 더 지켜보자."
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Holding Tesla right now probably feels like a daily rollercoaster. Down 9% YTD with a 407x P/E. It's natural to feel uneasy."
thread: [
  "Good news first: Baird upgraded to Outperform with a $548 target. 42% of 54 analysts still rate Buy, median target $480 (+17%). FSD also got EU approval in Netherlands.",
  "But 5 more robotaxi crashes were reported. Waymo raising $16B means competition is heating up. The xAI shareholder lawsuit adds governance risk. It's okay to feel uncertain.",
  "You're not alone. Retail investors own 40% of the float and have been buying every dip. Below the 50-day SMA ($441) but holding the 200-day ($388).",
  "April's Cybercab production launch and Q1 Optimus v3 unveil are the next big tests. Hang in there."
]
```

**Rules for all tones:**
- **X: thread format required.** `text` <= 280 chars, each `thread[]` entry <= 280 chars. Count characters carefully.
- **Threads: single text**, no character limit.
- `fact` tone text/thread must be identical to the default `snsContent.x` / `snsContent.threads` text
- All tones must contain the same core data points (price, target, upside %)
- All tones must include investment-useful context: catalysts, key price levels, risk/reward framing
- Write content that makes people want to stop scrolling and read the full analysis
- No links in tone text (the share button appends the URL automatically)
- No em dashes or interpuncts (`·`) anywhere

## Writing Guidelines

### General

- **No em dashes (`—`) or interpuncts (`·`)**: Do not use em dashes or middle dots (interpuncts) anywhere in report text, snsContent, or any other output. Use commas (`,`), periods (`.`), parentheses (`()`), or colons (`:`) instead. For listing items, use commas, not `·` or `|`.

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
