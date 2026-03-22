---
name: econ-calendar
description: Research and compile monthly US economic indicator calendar. Collects CPI, NFP, FOMC schedules, actual results, market reactions, and portfolio implications.
argument-hint: "[YYYY-MM] [update EVENT_ID] [summary]"
allowed-tools: WebSearch, WebFetch, Read, Write, Bash, Grep, Glob
---

# Monthly Economic Calendar Skill

Research and compile a monthly US economic indicator calendar with real data.

## Input

- `$ARGUMENTS`: One of three modes:
  - **Init:** `YYYY-MM` (e.g., `2026-04`) — create the month's calendar from scratch
  - **Update:** `YYYY-MM update EVENT_ID` (e.g., `2026-03 update nfp`) — update a specific event after release
  - **Summary:** `YYYY-MM summary` (e.g., `2026-03 summary`) — add month-end summary

If no arguments provided, default to the current month in Init mode.

## Output

2 JSON files per month:

| File | Language |
|------|----------|
| `data/calendar/YYYY-MM.json` | Korean |
| `data/calendar/YYYY-MM.en.json` | English |

JSON schema: follows `EconCalendarMonth` interface in `src/data/calendar/types.ts`.

## Mode 1: Init (Monthly Setup)

Run at the start of each month to set up the calendar.

### Research Steps

1. **WebSearch:** `"{month} {year} US economic calendar CPI NFP FOMC schedule"`
2. **WebSearch:** `"{month} {year} FOMC meeting date dot plot schedule"`
3. **WebSearch:** `"{month} {year} non-farm payrolls release date consensus estimate"`
4. **WebSearch:** `"{month} {year} CPI release date consensus forecast"`
5. **WebSearch:** `"CME FedWatch tool current probabilities fed funds rate"`

### Events to Include

Find dates and consensus estimates for all of the following (skip if not scheduled this month):

| Event | Category | ID suffix |
|-------|----------|-----------|
| Non-Farm Payrolls (NFP) | employment | nfp |
| Unemployment Rate | employment | unemployment |
| CPI (Consumer Price Index) | inflation | cpi |
| Core CPI | inflation | core-cpi |
| PPI (Producer Price Index) | inflation | ppi |
| PCE Price Index | inflation | pce |
| FOMC Meeting | fed | fomc |
| FOMC Minutes | fed | fomc-minutes |
| GDP (advance/second/third) | gdp | gdp |
| Retail Sales | other | retail-sales |
| ISM Manufacturing PMI | other | ism-mfg |
| ISM Services PMI | other | ism-svc |

**Note:** CPI and Core CPI are typically released together. You may combine them into a single event or list separately — use your judgment for clarity.

### Output Structure

For each event:
```json
{
  "id": "YYYY-MM-{suffix}",
  "name": "이벤트 이름 (영문 약어)",
  "category": "employment|inflation|fed|gdp|other",
  "date": "YYYY-MM-DD",
  "dateEnd": "YYYY-MM-DD (optional, for multi-day events like FOMC)",
  "status": "upcoming",
  "previous": "이전 발표치 (e.g., '151K', '2.8%')",
  "expected": "시장 컨센서스 (e.g., '200K', '2.9%')",
  "watchPoints": [
    "주목 포인트 1",
    "주목 포인트 2"
  ]
}
```

Top-level `rateOutlook`:
```json
{
  "rateOutlook": {
    "holdProbability": 82,
    "cutProbability": 18,
    "source": "CME FedWatch (YYYY-MM-DD 기준)"
  }
}
```

Events must be sorted by `date` ascending.

## Mode 2: Update (Post-Release)

Run after a specific event is released to add actual results.

### Arguments

`YYYY-MM update EVENT_ID` where EVENT_ID is the suffix (e.g., `nfp`, `cpi`, `fomc`)

### Research Steps

1. Read existing `data/calendar/YYYY-MM.json`
2. **WebSearch:** `"{event name} {month} {year} actual results"`
3. **WebSearch:** `"{event name} {month} {year} market reaction S&P treasury yield"`
4. If FOMC: **WebSearch:** `"FOMC {month} {year} dot plot summary Powell press conference"`

### Fields to Update

```json
{
  "status": "published",
  "actual": "+228K",
  "surprise": "above|below|inline",
  "marketReaction": "S&P 500 +0.8%, Nasdaq +1.2%, 10Y 국채금리 +5bp. 예상보다 강한 고용에 금리 인하 기대 후퇴.",
  "analysis": "강한 고용 시장이 확인되면서 연준의 금리 인하 시점이 더 늦춰질 수 있다. 성장주에는 단기 부담이지만, 경기 둔화 우려가 줄어든 점은 긍정적. 포트폴리오에서 경기 민감주 비중을 유지하는 것이 합리적."
}
```

Also update `rateOutlook` if the event impacts rate expectations (NFP, CPI, FOMC).

### Surprise Determination

- **above**: actual significantly beats expectations (positive for employment, negative for inflation)
- **below**: actual significantly misses expectations
- **inline**: actual within normal margin of expectations

## Mode 3: Summary (Month-End)

Run at the end of the month to add a retrospective.

### Arguments

`YYYY-MM summary`

### Research Steps

1. Read existing `data/calendar/YYYY-MM.json` (all events should be published)
2. **WebSearch:** `"{month} {year} US economic indicators summary review"`
3. **WebSearch:** `"{month} {year} stock market monthly summary S&P performance"`

### Fields to Add

```json
{
  "summary": {
    "text": "3월 경제지표 한 장 요약. NFP +228K로 예상 상회, CPI 2.8%로 소폭 하회하며 인플레이션 둔화 추세 확인. FOMC는 금리 동결하면서 연내 2회 인하 전망 유지. 전반적으로 경기 연착륙 시나리오에 부합하는 흐름.",
    "portfolioReview": "성장주 비중을 유지한 전략은 적절했다. CPI 하회 이후 기술주 반등에 수혜. 다만 FOMC 후 단기 변동성이 있었으므로, 발표 전 포지션 축소를 고려할 만했다.",
    "nextMonthPreview": "4월에는 1분기 GDP 속보치(4/30)가 핵심. 기업 실적 시즌도 본격화되므로 개별 종목 변동성 확대 예상. FOMC는 예정되어 있지 않으나, 4월 CPI(4/10)가 금리 경로에 중요한 변수."
  }
}
```

## Writing Guidelines

### Korean (`.json`)
- 초보 투자자도 이해할 수 있는 자연스러운 한국어
- 전문 용어 사용 시 괄호로 영문 표기 (e.g., "비농업 고용지표(NFP)")
- 분석은 항상 "투자자에게 어떤 의미인지"를 포함
- marketReaction: 주요 지수/금리 변동 수치 포함
- analysis: 2-3문장, 시장 해석 + 포트폴리오 시사점

### English (`.en.json`)
- Professional but accessible English
- Same structure and depth as Korean
- Include technical terms naturally
- Keep analysis actionable

## General Rules

- `updatedAt`: always set to current ISO timestamp (`new Date().toISOString()`)
- Events sorted by `date` ascending in the array
- Event IDs: `YYYY-MM-{suffix}` format (lowercase, hyphens)
- When updating, preserve all existing event data — only modify the targeted event
- Both Korean and English files must be updated simultaneously
- If data cannot be found for an event, note it in watchPoints rather than omitting the event
- After writing files, verify JSON validity with: `node -e "JSON.parse(require('fs').readFileSync('data/calendar/YYYY-MM.json','utf-8')); console.log('OK')"`
