---
name: stock-analysis
description: 미국 주식 종목 심층 분석. 티커를 입력하면 사업 모델, 재무 지표, 성장성, 리스크, 매수 근거를 쉽게 이해할 수 있도록 조사·정리. 주식 분석 요청 시 자동 적용.
argument-hint: "[티커심볼] (예: AAPL, TSLA, NVDA)"
allowed-tools: WebSearch, WebFetch, Read, Write, Bash, Task, Grep, Glob
---

# 미국 주식 종목 심층 분석 스킬

사용자가 미국 주식 티커를 제공하면, 해당 종목에 대해 **초보 투자자도 쉽게 이해할 수 있는 수준**으로 분석 리포트를 작성한다.

## 입력

- `$ARGUMENTS` — 분석할 티커 심볼 (예: AAPL, NVDA, TSLA)
- 티커가 없으면 사용자에게 물어볼 것

## 출력 형식

**JSON 파일**로 직접 저장한다:
- 경로: `data/analysis/reports/{SYMBOL}/{YYYY-MM-DD}.json`
- JSON 스키마: `src/data/analysis/types.ts`의 `StockAnalysisReport` 인터페이스를 따른다
- 서버가 `data/analysis/reports/` 디렉토리를 자동 스캔하므로 별도 등록 작업 불필요

## 분석 프로세스

### 1단계: 데이터 수집 (subagent 병렬 실행)

`us-data-researcher` subagent를 활용하여 다음 정보를 **동시에** 조사한다:

**a) 최신성 데이터 (매일 바뀌는 정보) — 최우선**
- 현재 주가, 시가총액
- 최근 1개월 내 주요 뉴스 5건 (날짜, 헤드라인, 의미, URL)
- 애널리스트 컨센서스 목표가, Buy/Hold/Sell 분포, 주목할 코멘트
- 기술적 지표: 52주 고저, RSI, 50일/200일 이동평균선 대비 위치

**b) 핵심 재무 지표**
- P/E, Forward P/E, 매출 성장률 (YoY), 영업이익률
- FCF (잉여현금흐름), 부채비율, ROE
- 각 지표마다 한 줄 해석 포함

**c) 투자 판단 데이터**
- 리스크 3-5개 (severity: critical/high/medium/low)
- 매수 근거 3가지 (title + rationale)
- 종합 의견 (3-4문장)

**d) 기본 정보 (변경 빈도 낮음)**
- 회사 설명 (oneLiner + description + howTheyMakeMoney + keyProducts)
- 성장 동력 3-4가지
- 경쟁우위 (summary + moats + competitors)

### 2단계: JSON 리포트 작성

수집한 데이터를 아래 구조의 JSON으로 작성한다.

```jsonc
{
  // 기본 정보
  "symbol": "BMNR",
  "companyName": "Bitmine Immersion Technologies",
  "analysisDate": "2026-02-18",    // 오늘 날짜
  "currentPrice": 20.96,
  "marketCap": "$9.5B",

  // 회사 설명 (변경 빈도 낮음)
  "businessSummary": {
    "oneLiner": "한 줄 설명",
    "description": "상세 설명 (초보자도 이해 가능하게)",
    "howTheyMakeMoney": ["수익원1", "수익원2"],
    "keyProducts": ["제품1", "제품2"]
  },

  // 핵심 숫자 (6개 내외)
  "keyMetrics": [
    { "name": "P/E (주가수익비율)", "value": "373x", "interpretation": "해석" }
  ],

  // 성장 동력
  "growthDrivers": [
    { "title": "제목", "description": "설명" }
  ],

  // 경쟁우위
  "competitiveAdvantage": {
    "summary": "요약",
    "moats": [{ "type": "유형", "description": "설명" }],
    "competitors": [{ "name": "경쟁사", "detail": "상세" }]
  },

  // 최근 뉴스 (5건, 최신순)
  "recentNews": [
    { "date": "2026-02-16", "headline": "헤드라인", "significance": "의미", "url": "https://..." }
  ],

  // 애널리스트 의견
  "analystOpinions": {
    "consensusTarget": 43.0,
    "highTarget": 47.0,
    "lowTarget": 39.0,
    "upsidePercent": 105,
    "buyCount": 2,
    "holdCount": 0,
    "sellCount": 0,
    "notableComment": "주목할 코멘트"
  },

  // 리스크 (severity: "critical" | "high" | "medium" | "low")
  "risks": [
    { "severity": "critical", "title": "제목", "description": "설명" }
  ],

  // 매수 근거
  "buyReasons": [
    { "title": "제목", "rationale": "근거" }
  ],

  // 기술적 위치
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

  // 종합 의견 (3-4문장)
  "overallOpinion": "종합 판단...",

  // 출처 (최소 8개)
  "sources": [
    { "name": "출처명", "url": "https://...", "description": "설명" }
  ]
}
```

### 3단계: SNS 콘텐츠 생성

리포트 JSON에 `snsContent` 필드를 포함한다.

#### 텍스트 브랜딩 4원칙

1. **공명**: 독자가 자기 상황을 투영할 수 있게 쓴다 ("지금 이 종목 들고 있으면 이런 기분일 거다")
2. **대리만족**: 성장·기회·결단 서사를 담는다 ("어제까지 상상이던 것이 오늘 현실이 됐다")
3. **구체적 숫자 하나**: 앵커 역할 (P/E 385배, 목표가 $600 등)
4. **질문형 마무리/행동 유도**: "당신은 어느 쪽에 서 있나요?"

#### 플랫폼별 가이드라인

| 플랫폼 | 필드 | 글자수 | 특징 |
|--------|------|--------|------|
| Threads/X | `snsContent.threads` | hook 50자, text 280자 이내 | 짧고 임팩트 있게. 이모지 1-2개 |
| Telegram | `snsContent.telegram` | hook 50자, text 500자 이내 | 좀 더 상세한 맥락. 숫자 강조 |

#### 예시

```json
"snsContent": {
  "threads": {
    "hook": "Tesla, P/E 385배인데 왜 사람들이 몰릴까?",
    "text": "어제까지 '전기차 회사'였던 Tesla가 오늘은 AI 로봇 회사가 됐다.\n\n자율주행 FSD 매출이 분기 $1B을 돌파하고, 옵티머스는 공장 라인에 실전 투입 중.\n\n목표가 $360 → 현재가 대비 +42%.\n\n당신은 전기차 회사에 투자하고 있나요, AI 회사에 투자하고 있나요?"
  },
  "telegram": {
    "hook": "Tesla 목표가 $360, 지금 진입해도 될까?",
    "text": "📊 Tesla 심층 분석 요약\n\n현재가 $254 | 목표가 $360 (+42%)\nP/E 385배로 고평가 논란이 있지만, FSD 매출 분기 $1B 돌파와 옵티머스 실전 투입이 변수.\n\n✅ 매수 포인트: AI 로봇·에너지 사업 확장, 자율주행 구독 모델\n⚠️ 리스크: 중국 경쟁 심화, 마진 압박\n\n\"전기차 회사가 아닌 AI 플랫폼으로 봐야 한다\" — 모건스탠리\n\n상세 분석 👉 investory.kro.kr"
  }
}
```

## 작성 원칙

1. **쉬운 말로 쓴다** — 투자 초보자도 이해할 수 있게. 전문 용어는 쉬운 설명을 덧붙인다.
2. **숫자에 근거한다** — 주관적 의견보다 데이터와 수치로 뒷받침한다.
3. **균형 잡힌 시각** — 장점만 나열하지 않고, 리스크도 솔직하게 다룬다.
4. **비교 관점** — 가능하면 동종 업계 경쟁사와 비교한다.
5. **최신 정보** — WebSearch로 가장 최근 데이터를 반드시 확인한다.
6. **출처 표기** — 모든 수치의 출처를 sources 배열에 포함한다. 최소 8개 이상.
7. **한국어** — 모든 텍스트는 한국어로 작성한다. 고유명사(회사명, 제품명)는 영어 유지.

## 기존 리포트가 있는 경우

같은 종목의 이전 리포트가 있다면 `data/analysis/reports/{SYMBOL}/` 에서 가장 최근 파일을 읽고:
- **변경된 부분만 업데이트** (뉴스, 가격, 애널리스트 의견, 기술적 위치 등)
- **변경되지 않은 기본 정보**는 그대로 재사용 (businessSummary, growthDrivers, competitiveAdvantage 등)
- **snsContent는 재사용하지 않는다** — 매번 최신 데이터로 새로 생성
- 이렇게 하면 작업 시간이 크게 단축된다

## 검색 전략

- `"{티커} stock analysis 2026"` — 최신 분석
- `"{티커} earnings Q4 2025"` — 최근 분기 실적
- `"{티커} analyst price target"` — 애널리스트 목표가
- `"{회사명} news {현재 월}"` — 최근 뉴스
- `"stockanalysis.com {티커}"` — 재무 지표 종합
- `"marketbeat.com {티커} forecast"` — 애널리스트 컨센서스
- `"investing.com {티커} technical"` — 기술적 지표

## 홈페이지 종목 자동 등록

분석 완료 후, 해당 종목이 홈페이지 "주목 종목" 리스트에 없으면 자동 추가한다.

1. `data/stocks/managed-stocks.json` 파일을 읽어 해당 심볼이 있는지 확인
2. 없으면 `POST /api/stocks` (body: `{ "symbol": "{티커}" }`)를 호출하여 추가
   - 이 API가 Finnhub에서 회사명/로고/업종을 자동 조회하고 파일+캐시에 저장함
   - dev 서버가 꺼져있으면 직접 `data/stocks/managed-stocks.json`에 항목 추가:
     `{ "symbol": "{티커}", "name": "{회사명}", "tag": "{업종}", "logo": "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/{티커}.png", "addedAt": "{오늘날짜}" }`
3. 이미 있으면 아무 작업도 하지 않음
