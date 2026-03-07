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
  //
  // ★ PLAIN LANGUAGE REQUIRED ★
  // 주식 초보자가 읽어도 바로 이해할 수 있게 써라. overallOpinion은 리포트의 최종 요약이다.
  // - 약어/전문 용어를 풀어서 써라:
  //   Bad: "NHTSA FSD 데이터 마감 D-2" → Good: "미국 도로교통안전청의 자율주행 심사 마감이 이틀 남았다"
  //   Bad: "200일 SMA $392 지지" → Good: "최근 200일 평균 주가($392) 근처에서 버티는 중"
  //   Bad: "RSI 41 과매도 접근" → Good: "매도 압력이 커지고 있어 반등 가능성도 있다"
  //   Bad: "Jobs shock + 유가 $90+" → Good: "고용지표 충격과 유가 90달러 돌파로 시장 전체가 흔들렸다"
  //   Bad: "UK Feb sales -37%" → Good: "영국 2월 판매가 37% 급감했다"
  // - 원인과 결과를 연결해서 써라. 숫자만 나열하지 말고 "왜 중요한지"를 한 마디 붙여라.
  // - 키워드 나열 금지. 완전한 문장으로 써라.
  "overallOpinion": [
    "핵심 이벤트/카탈리스트를 쉬운 말로 설명 + 수치 (1문장)",
    "호재 또는 악재를 원인-결과로 요약 + 수치 (1문장)",
    "현재 주가 위치와 앞으로의 방향을 쉽게 정리 (항상 마지막, 1문장)"
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
- **전문 용어 풀어쓰기**: 초보 투자자도 이해할 수 있게 써라. 약어나 전문 용어는 괄호로 설명을 붙이거나 쉬운 말로 바꿔라.
  - Bad: "NHTSA 마감 D-4" → Good: "미국 도로교통안전청(NHTSA) 자율주행 심사 마감이 4일 남았다"
  - Bad: "P/E 375x" → Good: "주가수익비율(P/E) 375배, 이익 대비 주가가 매우 비싸다"
  - Bad: "50일선 $431 하회" → Good: "최근 50일 평균 주가($431)보다 아래에 있다"
  - Bad: "컨센서스 $396" → Good: "애널리스트 평균 목표가 $396"
  - Bad: "Jobs shock and oil surging to $90+" → Good: "고용지표 충격과 유가 90달러 돌파로 시장이 흔들렸다"
  - Bad: "Binary event: pass triggers rally, fail risks 30% downside" → Good: "통과하면 반등, 불합격하면 30% 하락 위험이 있는 중요한 갈림길"
  - Bad: "RSI 41 approaching oversold" → Good: "매도 압력이 커지면서 반등 가능성도 열려 있다"
- **원인-결과 연결**: 숫자만 던지지 말고 "왜 중요한지" 한 마디를 붙여라.
  - Bad: "UK Feb sales -37%" → Good: "영국 2월 판매가 37% 급감하면서 유럽 매출 전망이 어두워졌다"
  - Bad: "Clinging to the 200-day SMA at $392" → Good: "최근 200일 평균 주가($392) 근처에서 버티고 있어, 이 선이 무너지면 추가 하락 가능성"

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
5. **Length: overallOpinion과 비슷하게**: 스레드 전체 길이가 overallOpinion(350-400자)과 비슷해야 한다. 너무 짧게 압축하지 마라. overallOpinion만큼의 정보량과 맥락을 SNS 톤으로 전달하라.
6. **쉬운 말로 쓰기**: overallOpinion에 있는 전문 용어를 SNS에서는 풀어서 써라. "P/E 375x" → "주가수익비율 375배(이익 대비 매우 비싼 수준)", "50일선 하회" → "최근 50일 평균 주가 아래로 내려갔다" 등. 주식 초보가 읽어도 무슨 뜻인지 바로 이해할 수 있어야 한다.

> **English version of the same rules:**
> 1. **Source: overallOpinion**: The snsContent body must be based on the `overallOpinion` field's key points. Do not add new insights or perspectives absent from overallOpinion. Follow the same ordering (news/events/catalysts first, price/technicals last).
> 2. **Adapt, don't copy**: Don't paste overallOpinion verbatim. Rewrite in SNS-friendly style: shorter sentences, bullet points, emphasized key figures.
> 3. **Keep the substance**: Change the tone, not the depth. Retain all numbers (targets, P/E, SMAs), catalysts, and risks from overallOpinion.
> 4. **Engagement layer**: Layer SNS elements on top of overallOpinion content: closing questions, contrast/irony framing.
> 5. **Length: match overallOpinion**: The total thread length should be similar to overallOpinion (350-400 chars). Don't over-compress. Deliver the same amount of information and context as overallOpinion, but in SNS tone.
> 6. **Plain language**: Explain jargon from overallOpinion in accessible terms. A beginner investor should understand every sentence.
>    - Bad: "P/E 375x" → Good: "price-to-earnings ratio of 375x (very expensive relative to profits)"
>    - Bad: "below 50-day SMA" → Good: "trading below its 50-day average price"
>    - Bad: "Jobs shock and oil surging to $90+" → Good: "a weak jobs report and oil prices jumping above $90 rattled the market"
>    - Bad: "Binary event: pass triggers rally" → Good: "this is a make-or-break moment: approval could spark a rally"
>    - Bad: "RSI 41 approaching oversold" → Good: "selling pressure is building, which sometimes means a bounce is near"
> 7. **Cause and effect**: Don't just state numbers. Explain WHY they matter in one phrase.
>    - Bad: "UK Feb sales -37%" → Good: "UK sales plunged 37% in February, dimming the European revenue outlook"
>    - Bad: "Clinging to the 200-day SMA at $392" → Good: "holding near its 200-day average price of $392, a key support level that could trigger further drops if broken"

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
- Each tweet MUST be <= 280 chars (including the thread indicator). Count carefully. This is a hard limit.
- The first tweet should work standalone. If someone only sees tweet 1, they should get the core message.
- Use `\n` for line breaks within a tweet. Each tweet is a separate string.
- Typical thread length: 3-4 tweets. Max 5 tweets.
- Don't start reply tweets with `-` bullets. Use flowing sentences or short paragraphs.
- **Thread indicator required**: Every tweet (including the first `text`) must end with `\n\n1/4`, `2/4`, `3/4`, `4/4` (adjust denominator to total tweet count). This helps readers know there are more tweets and encourages them to read the full thread. The indicator is part of the tweet text so it gets copied together.

##### Korean X Thread Template

```
// text (first tweet, <= 280 chars):
"$TSLA (2/23) Baird가 목표가 $548로 올렸다. 그런데 무인 택시는 또 5건 사고. 살 사람과 팔 사람이 완전히 갈렸다.\n\n1/4"

// thread (reply tweets, each <= 280 chars):
[
  "자율주행(FSD)이 네덜란드에서 EU 첫 승인을 받았다. 핸들 없는 무인 택시 Cybercab이 4월부터 양산, 9개 도시로 확대 예정. 유럽 진출의 첫 발이다.\n\n2/4",
  "리스크도 크다. 무인 택시 추가 사고 5건, 구글 Waymo가 $160억 투자해서 경쟁 본격화. 머스크의 xAI 이해충돌 주주 소송까지 겹쳤다.\n\n3/4",
  "종가 $411, 주가수익비율(P/E) 407배로 이익 대비 매우 비싼 수준\n최근 50일 평균($441) 아래, 200일 평균($388)은 지지 중\n애널리스트 평균 목표가 $480(+17%)\n\n4/4"
]
```

##### English X Thread Template

```
// text (first tweet, <= 280 chars):
"$TSLA (Feb 23) Baird upgrades to $548 target. Meanwhile, 5 more robotaxi crashes reported. Bulls and bears couldn't be further apart.\n\n1/4"

// thread (reply tweets, each <= 280 chars):
[
  "Self-driving (FSD) just got EU approval in the Netherlands. Cybercab, a fully driverless taxi, starts mass production in April across 9 cities.\n\n2/4",
  "Risks are real too. 5 more robotaxi crashes, Google's Waymo raising $16B to compete, and a Musk xAI conflict-of-interest lawsuit piling on.\n\n3/4",
  "Close $411, P/E ratio 407x (very expensive vs earnings)\nBelow 50-day avg ($441), holding 200-day ($388)\nAnalyst avg target $480 (+17%)\n\n4/4"
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
text: "$TSLA (2/23) Baird가 목표가 $548 제시, 애널리스트 42%가 매수 의견 유지. 평균 목표가 $480(지금보다 +17%). 한편 무인 택시 추가 사고 5건 보고\n\n1/4"
thread: [
  "자율주행(FSD)이 네덜란드에서 EU 첫 승인. 핸들도 페달도 없는 무인 택시 Cybercab이 4월부터 양산, 9개 도시 확대 예정이다.\n\n2/4",
  "리스크도 있다. 무인 택시 안전성 논란 재부각, 구글 Waymo가 $160억 투자로 경쟁 본격화. 머스크 xAI 이해충돌 소송까지 경영 리스크.\n\n3/4",
  "종가 $411, 주가수익비율(P/E) 407배로 이익 대비 비싼 수준\n목표가 $480(+17%)\n4월 Cybercab 양산과 로봇 Optimus v3 공개가 상반기 핵심\n\n4/4"
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Baird sets $548 target, 42% of analysts rate Buy. Avg target $480 (+17%). But 5 more robotaxi crashes just reported.\n\n1/4"
thread: [
  "Self-driving (FSD) gets EU approval in Netherlands. Cybercab, a fully driverless taxi, starts mass production in April across 9 cities.\n\n2/4",
  "Risks: robotaxi safety concerns resurface. Google's Waymo raises $16B to compete. Musk's xAI conflict-of-interest lawsuit adds governance risk.\n\n3/4",
  "Close $411, P/E ratio 407x (expensive vs earnings)\nTarget $480 (+17%)\nApril Cybercab ramp and Optimus robot v3 unveil are key H1 catalysts\n\n4/4"
]
```

##### witty tone style (재밌게)

Natural, conversational flow. Sentences should **connect to each other** like a story, not isolated jokes. Use humor through contrast and irony, not forced memes. Stay factually accurate. **Even with humor, include investment-useful information.** The reader should laugh AND learn something. X format uses thread.

Korean X thread example:
```
text: "$TSLA (2/23) Baird가 $548을 외치는 동안, 무인 택시는 또 5번을 박았다. 아이러니하지만 이게 테슬라다.\n\n1/4"
thread: [
  "자율주행(FSD)이 네덜란드에서 EU 승인을 땄고, 무인 택시 Cybercab은 4월에 핸들도 페달도 없이 출격한다. 구글 Waymo가 $160억 들고 쫓아오지만, 유럽은 테슬라가 먼저 발을 디뎠다.\n\n2/4",
  "주가수익비율(P/E) 407배는 숫자가 아니라 믿음 체계다. 개인 투자자 40%가 그 믿음에 동참 중이고, 빠질 때마다 오히려 더 사고 있다.\n\n3/4",
  "종가 $411, 애널리스트 평균 목표가 $480(+17%)\n4월 양산이 다음 심판의 날\n\n4/4"
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Baird slaps a $548 target on Tesla while the robotaxis rack up 5 more crashes. The irony writes itself.\n\n1/4"
thread: [
  "Self-driving (FSD) just got EU approval in the Netherlands. Cybercab rolls out in April, fully driverless. Google's Waymo has $16B to chase, but Tesla got to Europe first.\n\n2/4",
  "A P/E ratio of 407x isn't a valuation, it's a belief system. Retail investors own 40% of shares and keep buying every dip.\n\n3/4",
  "Close $411, Analyst avg target $480 (+17%)\nApril production is judgment day\n\n4/4"
]
```

**Key:** Each sentence leads naturally into the next. The humor comes from juxtaposition (upgrade vs crash, no steering wheel), not from random emoji or slang. But even the jokes carry real data points the reader can use.

##### empathy tone style (공감형)

Write like talking to a friend who holds this stock. **Longer and more detailed than other tones.** Start by acknowledging the investor's current emotional state. Present both good and bad news honestly. End with a concrete upcoming catalyst and gentle encouragement. **Include specific numbers and context so the reader gets real investment value, not just emotional support.** X format uses thread (can have more tweets than other tones, up to 5).

Korean X thread example:
```
text: "$TSLA (2/23) 테슬라 들고 있으면 요즘 하루가 롤러코스터 같을 거다. 연초 대비 -9%, 주가수익비율 407배. 불안한 게 당연하다.\n\n1/5"
thread: [
  "좋은 소식부터. Baird가 $548로 올렸고, 54명 애널리스트 중 42%가 매수 유지. 평균 목표가 $480, 지금보다 +17%다. 자율주행(FSD)도 네덜란드에서 EU 승인을 받았다.\n\n2/5",
  "하지만 무인 택시 추가 사고 5건, 구글 Waymo $160억 투자로 경쟁 본격화. 머스크 xAI 이해충돌 주주 소송까지. 불안한 마음이 드는 게 당연하다.\n\n3/5",
  "그래도 혼자가 아니다. 개인 투자자 40%가 함께 보유 중이고, 빠질 때마다 오히려 매수를 늘려왔다. 최근 50일 평균($441) 아래지만 200일 평균($388)은 지키고 있다.\n\n4/5",
  "4월 무인 택시 Cybercab 양산과 로봇 Optimus v3 공개가 다음 시험대다. 조금만 더 지켜보자.\n\n5/5"
]
```

English X thread example:
```
text: "$TSLA (Feb 23) Holding Tesla right now probably feels like a daily rollercoaster. Down 9% YTD with a P/E ratio of 407x. It's natural to feel uneasy.\n\n1/5"
thread: [
  "Good news first: Baird upgraded to $548 target. 42% of 54 analysts still rate Buy, avg target $480 (+17%). Self-driving (FSD) also got EU approval in Netherlands.\n\n2/5",
  "But 5 more robotaxi crashes were reported. Google's Waymo raising $16B means competition is heating up. Musk's xAI shareholder lawsuit adds governance risk. It's okay to feel uncertain.\n\n3/5",
  "You're not alone. Retail investors own 40% of shares and have been buying every dip. Below the 50-day average ($441) but holding the 200-day ($388).\n\n4/5",
  "April's driverless Cybercab production launch and Optimus robot v3 unveil are the next big tests. Hang in there.\n\n5/5"
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
