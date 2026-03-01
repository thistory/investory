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

**em dash (`—`), 가운뎃점(`·`) 절대 금지.** 콤마(`,`), 마침표(`.`), 괄호(`()`), 콜론(`:`)으로 대체. 항목 나열 시 `·` 대신 콤마(`,`)를 사용하라.

#### SNS Content Quality Guidelines

**`overallOpinion`을 바탕으로, SNS 글 성격에 맞게 재구성하라.**

snsContent는 별도로 창작하는 것이 아니라, **`overallOpinion` 필드의 내용을 SNS 톤으로 변환**한 것이어야 한다. overallOpinion의 핵심 포인트, 수치, 맥락을 그대로 살리되, SNS에서 읽히는 문체로 바꿔라.

1. **Source: overallOpinion**: snsContent의 본문은 반드시 `overallOpinion`의 핵심 포인트들을 기반으로 작성하라. 새로운 내용을 추가하거나 overallOpinion에 없는 관점을 넣지 마라. overallOpinion의 순서(뉴스/이벤트/카탈리스트 → 가격/기술적 분석)를 그대로 따라라.
2. **Adapt, don't copy**: overallOpinion을 그대로 복붙하지 마라. SNS에 맞게 문체를 바꿔라. 딱딱한 분석 톤 → 짧고 임팩트 있는 문장, 불릿 포인트 활용, 핵심 수치 강조.
3. **Keep the substance**: 톤은 바꾸되 내용의 깊이는 유지하라. overallOpinion에 있는 수치(목표가, P/E, 이평선 등), 카탈리스트, 리스크를 빠뜨리지 마라.
4. **Engagement layer**: overallOpinion의 내용 위에 SNS적 요소를 입혀라. 질문형 마무리, 이모지(Threads), 대비/아이러니 활용 등.

> **English version of the same rules:**
> 1. **Source: overallOpinion**: The snsContent body must be based on the `overallOpinion` field's key points. Do not add new insights or perspectives absent from overallOpinion. Follow the same ordering (news/events/catalysts first, price/technicals last).
> 2. **Adapt, don't copy**: Don't paste overallOpinion verbatim. Rewrite in SNS-friendly style: shorter sentences, bullet points, emphasized key figures.
> 3. **Keep the substance**: Change the tone, not the depth. Retain all numbers (targets, P/E, SMAs), catalysts, and risks from overallOpinion.
> 4. **Engagement layer**: Layer SNS elements on top of overallOpinion content: closing questions, emojis (Threads), contrast/irony framing.

#### Korean SNS (`.json`)

##### X (Twitter) Base Format

```
${SYMBOL} ({M/D})
- {핵심 포인트를 짧은 문장으로}
- {수치와 맥락을 함께 설명}
- {누가 뭘 했는지 명확하게}

⚠️ {리스크를 문장으로 설명}
핵심: {가장 중요한 변수}

평균 목표가 ${avg target} (현재가 ${current price} 대비 +{upside}%)
{밸류에이션 지표 1}, {지표 2}

{종합 의견에서 한줄 요약}
```

> **Note:** Do NOT include links like `상세 분석 👉 investory.kro.kr` in snsContent. The share button automatically appends the current page URL.

#### English SNS (`.en.json`)

##### X (Twitter) Base Format

```
${SYMBOL} ({Mon D})
- {Write each point as a short, readable sentence}
- {Include numbers with context, not just raw data}
- {Make it clear who did what}

⚠️ {Explain the risk in a sentence}
Key: {Most important variable}

Avg Target ${target} (vs current ${price}, +{upside}%)
{Valuation metric 1}, {Metric 2}

{One-line summary from overall opinion}
```

> **Note:** Do NOT include `Full analysis 👉 investory.kro.kr/en` in snsContent. The share button automatically appends the page URL.

#### Platform Variation Rules

| Platform | Field | Length | Difference from X |
|----------|-------|--------|-------------------|
| X | `snsContent.x` | hook 50 chars, **no text char limit** | Use base format as-is |
| Threads | `snsContent.threads` | hook 50 chars, **no text char limit** | Slightly more casual tone, add 1-2 emojis |

**All platforms:** Write in short, readable sentences. No keyword dumps. No em dashes. Aim for `overallOpinion`-level depth and length.

#### Tone Variants (`snsContent.tones`)

Generate 3 tone variants for both X and Threads. Each tone set lives under `snsContent.tones.x` and `snsContent.tones.threads`.

```jsonc
"snsContent": {
  "x": { "hook": "...", "text": "..." },        // default (same as fact tone)
  "threads": { "hook": "...", "text": "..." },   // default (same as fact tone)
  "telegram": { "hook": "...", "text": "..." },
  "tones": {
    "x": {
      "fact":    { "hook": "...", "text": "..." },
      "witty":   { "hook": "...", "text": "..." },
      "empathy": { "hook": "...", "text": "..." }
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

Factual summary with analytical insight baked in. Use `-` bullet points. **Don't just state the fact. Explain why it matters for investors.** Length should be similar to `overallOpinion` (3-5 substantive points). Include actionable context: what it means for the stock, upcoming catalysts, valuation perspective.

Korean example:
```
$TSLA (2/23)
- Baird가 Outperform으로 업그레이드하며 목표가 $548 제시. 54명 애널리스트 중 42%가 Buy, 중앙값 $480(현재가 대비 +17%)
- FSD가 네덜란드에서 EU 승인을 획득하면서 유럽 확장의 실질적인 발판이 마련됨. 글로벌 TAM 확대 기대
- Cybercab이 4월 본격 양산에 돌입하며 9개 도시로 확대 예정. 핸들과 페달 없는 완전 자율주행 차량

⚠️ 로보택시에서 5건의 추가 충돌이 보고되며 안전성 논란이 재부각. Waymo가 $160억을 조달하면서 경쟁도 치열해지는 중
xAI 투자 이해충돌 주주 소송이 가열되고 있어 경영 리스크로 작용 가능

종가 $411, P/E 407x, Forward P/E 210x, 목표가 $480(+17%)
4월 Cybercab 양산과 Optimus v3 Q1 공개가 상반기 핵심 카탈리스트
```

English example:
```
$TSLA (Feb 23)
- Baird upgrades to Outperform with a $548 target. Of 54 analysts, 42% rate Buy with a median target of $480, implying 17% upside from current levels
- FSD gains EU approval in Netherlands, establishing a real foothold for European expansion and broadening the global TAM
- Cybercab enters mass production in April across 9 cities. A fully autonomous vehicle with no steering wheel or pedals

⚠️ 5 more robotaxi crashes reported, reigniting safety concerns. Waymo's $16B raise intensifies the competitive landscape
xAI investment conflict draws shareholder lawsuits, adding governance risk

Close $411, P/E 407x, Fwd P/E 210x, Target $480 (+17%)
April Cybercab ramp and Q1 Optimus v3 unveil are the key H1 catalysts
```

##### witty tone style (재밌게)

Natural, conversational flow. Sentences should **connect to each other** like a story, not isolated jokes. Use humor through contrast and irony, not forced memes. Stay factually accurate. **Even with humor, include investment-useful information.** The reader should laugh AND learn something. Length should be similar to `overallOpinion`.

Korean example:
```
$TSLA (2/23)
Baird가 목표가 $548을 외치는 동안, 로보택시는 또 5번을 박았다. 아이러니하지만, 이게 테슬라다.

FSD가 네덜란드에서 EU 승인을 따냈고, Cybercab은 4월에 핸들도 페달도 없이 출격한다. Waymo가 $160억을 들고 쫓아오지만, 일단 유럽은 테슬라가 먼저 발을 디뎠다.

P/E 407배는 숫자가 아니라 일종의 믿음 체계다. 그런데 리테일 투자자 40%가 그 믿음에 동참 중이고, 떨어질 때마다 오히려 더 사고 있다.

종가 $411, 목표가 $480(+17%), 4월 양산이 다음 심판의 날
```

English example:
```
$TSLA (Feb 23)
Baird slaps a $548 target on Tesla while the robotaxis rack up 5 more crashes. The irony writes itself.

FSD just got EU approval in the Netherlands, and Cybercab rolls out in April with no steering wheel and no pedals. Waymo has $16B to chase, but Tesla got to Europe first.

P/E at 407x isn't a valuation, it's a belief system. And 40% retail ownership means a lot of believers are buying every dip.

Close $411, Target $480 (+17%), April production is judgment day
```

**Key:** Each sentence leads naturally into the next. The humor comes from juxtaposition (upgrade vs crash, no steering wheel), not from random emoji or slang. But even the jokes carry real data points the reader can use.

##### empathy tone style (공감형)

Write like talking to a friend who holds this stock. **Longer and more detailed than other tones.** Start by acknowledging the investor's current emotional state. Present both good and bad news honestly, with enough detail that the reader can make their own judgment. End with a concrete upcoming catalyst and gentle encouragement. **Include specific numbers and context so the reader gets real investment value, not just emotional support.**

Korean example:
```
$TSLA (2/23)
테슬라를 들고 있으면 요즘 하루가 롤러코스터 같을 것이다. 연초 대비 -9% 하락에 P/E 407배라는 숫자를 보면 불안해지는 게 당연하다.

좋은 소식부터 보면, Baird가 목표가 $548을 제시하며 Outperform으로 올렸다. 54명 애널리스트 중 42%가 Buy를 유지하고 있고, 중앙값 목표가는 $480으로 현재가 대비 +17%다. FSD도 네덜란드에서 EU 승인을 받아 유럽 진출의 실마리가 보이기 시작했다.

하지만 로보택시에서 5건의 추가 충돌이 보고됐고, Waymo가 $160억을 조달하면서 경쟁이 본격화되고 있다. xAI 투자를 둘러싼 주주 소송도 뜨겁다. 불안한 마음이 드는 게 당연하다.

그래도 혼자가 아니다. 리테일 투자자 40%가 함께 보유 중이고, 하락할 때마다 오히려 매수를 늘려왔다. 50일 이동평균($441) 아래에 있지만 200일선($388)은 지켜내고 있다. 4월 Cybercab 양산 시작과 Optimus v3 Q1 공개가 다음 시험대다. 조금만 더 지켜보자.
```

English example:
```
$TSLA (Feb 23)
Holding Tesla right now probably feels like a daily rollercoaster. Down 9% YTD with a 407x P/E, it's natural to feel uneasy.

The good news: Baird just upgraded to Outperform with a $548 target. Of 54 analysts, 42% still rate it Buy, with a median target of $480, implying 17% upside. FSD also secured EU approval in the Netherlands, opening a real path into Europe.

But 5 more robotaxi crashes were reported, and Waymo raising $16B means competition is heating up fast. The xAI shareholder lawsuit adds governance risk. It's okay to feel uncertain.

You're not alone though. Retail investors own 40% of the float and have been buying every dip. The stock sits below its 50-day SMA ($441) but holds above the 200-day ($388). April's Cybercab production launch and the Q1 Optimus v3 unveil are the next big tests. Hang in there.
```

**Key:** No character limit for empathy tone (can exceed 280 chars). Write as much as needed to be genuinely comforting and informative. The reader should feel understood, not sold to. **But always include real numbers and catalysts so the reader walks away with useful information.**

**Rules for all tones:**
- **No character limit** for any tone. Write with `overallOpinion`-level depth and length.
- `fact` tone text must be identical to the default `snsContent.x` / `snsContent.threads` text
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
