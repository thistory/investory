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
  // ★ P/E 비교 기준 필수 ★
  // P/E(PER)를 표시할 때는 반드시 비교 기준을 함께 제시한다:
  //   - 업종/섹터 평균 P/E (예: "반도체 업종 평균 35x 대비 47x")
  //   - S&P 500 평균 P/E (예: "S&P 500 평균 22x 대비 381x")
  //   - 동종 경쟁사 P/E (예: "AMD 45x, Intel 25x 대비")
  //   - Forward P/E도 동일하게 비교 기준 포함
  // interpretation 필드에 비교 수치를 포함해서 투자자가 "이게 비싼 건지 싼 건지" 즉시 판단할 수 있게 한다.
  // 예: { "name": "P/E (TTM)", "value": "47.7x", "interpretation": "반도체 업종 평균(35x)보다 높지만, 65% 성장률 감안 시 PEG 0.73으로 합리적" }
  "keyMetrics": [
    { "name": "P/E (Price-to-Earnings)", "value": "373x", "interpretation": "S&P 500 평균(22x) 대비 17배. 업종 평균 대비 극단적 프리미엄" }
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

  // Investment Verdict (최종 주관적 결론)
  // 모든 분석을 종합한 후, 투자자에게 도움이 될 주관적 판단을 내린다.
  // stance: 데이터와 상황을 종합한 현재 시점의 투자 판단
  // summary: "왜 이 판단인지"를 2-3문장으로 설명. 구체적 근거(숫자, 이벤트)를 포함.
  //   초보 투자자도 이해할 수 있게 쉬운 말로 쓴다.
  //   예: "현재 PER 15배로 동종업계 평균(25배) 대비 저평가 상태이고, AI 매출이 분기마다 2배씩 성장 중이다. 다만 중국 규제 리스크가 있어 전액 투자보다는 분할 매수가 안전하다."
  // horizon: 이 판단이 유효한 투자 기간 (예: "3-6개월", "1-2주 (이벤트 후 재평가 필요)", "6개월-1년")
  "investmentVerdict": {
    "stance": "buy",          // "strong-buy" | "buy" | "hold" | "sell" | "strong-sell"
    "summary": "근거를 포함한 2-3문장의 주관적 결론",
    "horizon": "3-6개월"       // 판단 유효 기간
  },

  // Sources (minimum 8)
  "sources": [
    { "name": "Source name", "url": "https://...", "description": "Description" }
  ]
}
```

### SNS Content Format

Add an `snsContent` field to the report JSON.

**핵심 원칙: `overallOpinion`이 곧 SNS 콘텐츠다.**

overallOpinion은 이미 쉬운 말, 원인-결과, 투자 인사이트를 갖추고 있다. SNS는 이걸 플랫폼 포맷에 맞게 나누기만 하면 된다. 별도로 새 글을 쓰는 게 아니다.

#### 핵심 목표

1. **이해하기 쉽게**: 주식 초보도 바로 이해할 수 있어야 한다
2. **후킹**: 스크롤을 멈추게 만들어라. 첫 문장이 가장 중요하다
3. **인사이트 전달**: 읽은 사람이 "이 주식 지금 어떤 상황인지" 파악할 수 있어야 한다
4. **투자 도움**: 목표가, 리스크, 다음 이벤트 등 실제 판단에 도움되는 정보를 담아라

#### overallOpinion → SNS 변환 규칙

**overallOpinion 항목(3-4개)을 그대로 SNS로 변환한다.** 새 내용을 추가하거나 빼지 마라.

변환 과정:
1. overallOpinion에서 **가장 임팩트 있는 한 문장**을 뽑아 첫 트윗(훅)으로 쓴다
2. 나머지 항목을 **하나씩 트윗으로 분리**한다
3. 마지막 트윗에 **목표가, 현재 위치, 결론**을 넣는다

#### 글쓰기 스타일

**투자 커뮤니티에서 신뢰받는 사람이 쓰는 느낌.** 데이터는 정확하게, 표현은 편하게.

- 보고서 톤 금지 ("~로 분석됨", "~것으로 사료됨")
- 과한 이모지, 밈, 감탄사 금지 ("대박!", "미쳤다!")
- 짧은 문장. 한 문장에 한 가지 정보만
- 주어 명확히: "업그레이드됐다"(X) → "Baird가 업그레이드했다"(O)
- em dash (`—`), 가운뎃점(`·`) 절대 금지. 콤마, 마침표, 괄호, 콜론으로 대체
- 링크 넣지 마라 (공유 버튼이 자동으로 붙인다)

#### X (Twitter) Thread Format

X는 트윗당 280자 제한이 있다. **overallOpinion의 각 항목을 트윗 1개로 매핑**한다.

| 트윗 | 역할 | overallOpinion 매핑 |
|------|------|-------------------|
| 1st (`text`) | 훅 | overallOpinion에서 가장 강렬한 한 문장 + 티커, 가격 |
| 2nd~Nth (`thread[]`) | 본문 | 나머지 overallOpinion 항목을 1:1로 매핑 |
| Last | 결론 | 목표가, 현재 위치, 한 줄 판단 |

**형식 규칙:**
- 모든 트윗은 280자 이하 (스레드 번호 포함)
- 모든 트윗 끝에 `\n\n1/4`, `2/4` 등 스레드 번호 필수
- 3-4개 트윗이 적정. 최대 5개
- 첫 트윗만 봐도 핵심을 파악할 수 있어야 한다

##### Korean X Thread Example

overallOpinion이 이렇다면:
```
[
  "자율주행 안전 심사 마감이 이틀 남았다(3/9). 통과하면 반등, 실패하면 30% 급락할 수 있는 갈림길이다.",
  "영국 2월 판매가 37% 급감하면서 유럽 매출 전망이 어두워졌고, Toyota가 탄소 배출권 협력에서 빠졌다.",
  "고용 악화에 유가 90달러 돌파까지 겹쳐 $396.73 마감. 200일 평균($392) 위에서 간신히 버티는 중."
]
```

X thread로 변환하면:
```
text: "$TSLA (3/7) 자율주행 안전 심사가 이틀 남았다. 통과하면 반등, 실패하면 30% 급락. 악재 속 $396.73 마감.\n\n1/4"
thread: [
  "영국 2월 판매 37% 급감, Toyota가 탄소 배출권 협력에서 빠졌다. 유럽 매출 전망이 어두워졌다.\n\n2/4",
  "고용 악화에 유가 90달러 돌파까지. 10월 이후 최악의 한 주. 200일 평균($392) 위에서 간신히 버티는 중.\n\n3/4",
  "애널리스트 평균 목표가 $427(+7.5%). 3/9 심사 결과가 모든 걸 결정한다.\n\n4/4"
]
```

##### English X Thread Example

```
text: "$TSLA (Mar 7) Self-driving safety review deadline is 2 days away. Pass = rally, fail = 30% drop. Down to $396.73.\n\n1/4"
thread: [
  "UK Feb sales plunged 37%. Toyota left the EU carbon credit pool. European outlook is darkening.\n\n2/4",
  "Weak jobs data plus oil above $90. Worst week since October. Barely holding above its 200-day average of $392.\n\n3/4",
  "Analyst avg target $427 (+7.5%). Monday's review result will set the direction.\n\n4/4"
]
```

#### Threads Format

글자 제한 없음. `text` 필드 하나에 overallOpinion 전체를 자연스럽게 풀어쓴다.

구조: 티커 + 가격 → 빈 줄 → overallOpinion 내용을 2-3개 단락으로 → 결론

```
text: "$TSLA (3/7) $396.73(-2.17%)\n\n자율주행 안전 심사 마감이 이틀 남았다(3/9). 통과하면 반등, 실패하면 30% 급락. 갈림길이 코앞이다.\n\n영국 판매 37% 급감, Toyota 탄소 협력 탈퇴. 고용 악화에 유가 90달러까지. 최악의 한 주였다.\n\n200일 평균($392) 위에서 간신히 버팀. 목표가 $427(+7.5%). 월요일 결과 보고 판단해도 늦지 않다."
```

#### Telegram Format

`text` 필드 하나. 구조화된 섹션으로 정보를 정리한다.

```
text: "Tesla 일일 분석 (3/7)\n\n가격: $396.73 (-2.17%)\n\n핵심 이슈\n- 자율주행 안전 심사 마감 이틀 남음(3/9)\n- 통과하면 반등, 실패하면 30% 급락 가능\n- 영국 2월 판매 37% 급감\n- 고용 악화, 유가 90달러 돌파\n\n주가 위치\n- 200일 평균($392) 위에서 버팀\n- 50일 평균($428)보다는 아래\n\n목표가: $427 (+7.5%)"
```

#### JSON Structure

```jsonc
"snsContent": {
  "x": { "hook": "한 줄 요약", "text": "첫 트윗...\n\n1/4", "thread": ["2번째...\n\n2/4", "..."] },
  "threads": { "hook": "한 줄 요약", "text": "전체 본문..." },
  "telegram": { "hook": "한 줄 요약", "text": "구조화된 본문..." },
  "tones": {
    "x": {
      "fact":    { "hook": "...", "text": "...", "thread": ["..."] },
      "witty":   { "hook": "...", "text": "...", "thread": ["..."] },
      "empathy": { "hook": "...", "text": "...", "thread": ["..."] }
    },
    "threads": {
      "fact":    { "hook": "...", "text": "..." },
      "witty":   { "hook": "...", "text": "..." },
      "empathy": { "hook": "...", "text": "..." }
    }
  }
}
```

#### Tone Variants

3가지 톤으로 변주한다. **모든 톤에 같은 핵심 데이터(가격, 목표가, 상승여력)가 포함되어야 한다.**

| Tone | 한국어 | English | 스타일 |
|------|--------|---------|--------|
| `fact` | 팩트정리 | Facts | 사실 + "왜 중요한지" 설명. 기본 톤과 동일 |
| `witty` | 재밌게 | Witty | 대비와 아이러니로 재미. 웃기면서도 배울 게 있어야 함 |
| `empathy` | 공감형 | Relatable | 주주의 감정을 인정하고, 좋은 소식과 나쁜 소식을 솔직하게 전달 |

**fact = 기본값.** `snsContent.x`와 `tones.x.fact`는 동일한 내용이어야 한다. Threads도 마찬가지.

##### witty 톤 규칙
- 대비/아이러니로 재미를 만든다 (목표가 올림 vs 사고 증가, 주가 비쌈 vs 계속 사는 사람들)
- 문장이 자연스럽게 이어져야 한다. 독립된 개그가 아니라 스토리처럼
- **재미 속에 투자 정보가 있어야 한다.** 웃기기만 하면 안 된다

Korean witty example:
```
text: "$TSLA (3/7) 월요일에 자율주행 심사 결과가 나온다. 통과하면 축포, 실패하면 30% 급락. 주말이 길게 느껴질 거다.\n\n1/4"
```

##### empathy 톤 규칙
- 주주의 감정을 먼저 인정한다 ("힘든 한 주였을 거다", "불안한 게 당연하다")
- 좋은 소식과 나쁜 소식을 솔직하게 전달
- 구체적 숫자와 다음 이벤트로 마무리 ("조금만 더 지켜보자")
- fact/witty보다 길어도 된다 (X에서 최대 5트윗)

Korean empathy example:
```
text: "$TSLA (3/7) 테슬라 들고 있으면 이번 주 정말 힘들었을 거다. -2.17%, $396.73. 10월 이후 최악의 한 주.\n\n1/4"
```

#### 공통 규칙

- X: `text` <= 280자, `thread[]` 각 항목 <= 280자. 글자 수를 정확히 세라
- Threads: 글자 제한 없음. 단일 `text` 필드
- 모든 톤에 핵심 데이터 포함 (가격, 목표가, 상승여력%)
- 링크 넣지 마라 (공유 버튼이 자동 추가)
- em dash, 가운뎃점 절대 금지

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
