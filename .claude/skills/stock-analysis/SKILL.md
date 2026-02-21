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
- 종합 의견 (- 나열식, 3-5개 핵심 포인트)

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

  // 종합 의견 (- 나열식, 3-5개 항목)
  "overallOpinion": [
    "2/25 Q4 실적 발표 D-4, Meta 다년 파트너십·OpenAI $300억 투자·GB300 삼중 촉매 구간",
    "Forward P/E 26.9(PEG 0.68)는 62%+ 성장률 대비 여전히 매력적, 39명 중 37명 매수",
    "중국 점유율 66%→8% 급락, DeepSeek 효율성 충격은 단기 주의 요소",
    "Q1 FY2027 가이던스 $750억 달성 여부가 목표가 추가 상향의 분수령"
  ],

  // 출처 (최소 8개)
  "sources": [
    { "name": "출처명", "url": "https://...", "description": "설명" }
  ]
}
```

### 3단계: SNS 콘텐츠 생성

리포트 JSON에 `snsContent` 필드를 포함한다. **X(Twitter)를 기본 양식**으로 하고, Telegram과 Threads는 X에서 조금씩 변형한다.

#### X(Twitter) 기본 양식 — 모든 플랫폼의 베이스

```
오늘의투자 {SYMBOL} ({M/D})
- {핵심 포인트 1}
- {핵심 포인트 2}
- {핵심 포인트 3}
- {핵심 포인트 4}

⚠️ {주요 리스크 요약 | 보조 리스크}
핵심: {가장 중요한 변수}

목표가 ${목표가} (현재가 ${현재가} 대비 +{업사이드}%)
{주요 밸류에이션 지표 1} · {지표 2}

{종합 의견에서 한줄 평}

상세 분석 👉 investory.kro.kr
```

#### 플랫폼별 변형 규칙

| 플랫폼 | 필드 | 글자수 | X 대비 차이 |
|--------|------|--------|-------------|
| X | `snsContent.x` | hook 50자, text 280자 이내 | 기본 양식 그대로 |
| Threads | `snsContent.threads` | hook 50자, text 280자 이내 | 톤을 약간 캐주얼하게, 이모지 1-2개 추가 |
| Telegram | `snsContent.telegram` | hook 50자, text 500자 이내 | 이모지 아이콘(📊✅⚠️) 활용, 약간 더 상세한 맥락 추가 |

#### 예시

```json
"snsContent": {
  "x": {
    "hook": "NVIDIA 실적 발표 D-4, 삼중 촉매 구간",
    "text": "오늘의투자 NVIDIA (2/21)\n- Meta 수백만 대 GPU 다년 계약 체결\n- OpenAI $300억 투자 거의 확정\n- GB300: Hopper 대비 50배 효율·35배 비용절감\n- Q4 컨센서스 $656억(+67%), 초과 달성 전망\n\n⚠️ 옵션 시장 ±7% 변동 내재 | 중국 점유율 8%로 급락\n핵심: Q1 가이던스 $750억 달성 여부\n\n목표가 $256 (현재가 $189.82 대비 +35%)\nForward P/E 26.9 · PEG 0.68\n\nQ1 가이던스가 분수령, 촉매는 충분하다\n\n상세 분석 👉 investory.kro.kr"
  },
  "threads": {
    "hook": "NVIDIA 실적 D-4, 이 촉매 놓치면 안 됨",
    "text": "오늘의투자 NVIDIA (2/21) 🚀\n- Meta 수백만 대 GPU 다년 계약\n- OpenAI $300억 투자 거의 확정\n- GB300: Hopper 대비 50배 효율\n- Q4 $656억(+67%) 초과 달성 전망\n\n⚠️ 옵션 ±7% 변동 | 중국 점유율 8% 급락\n핵심: Q1 가이던스 $750억\n\n목표가 $256 (현재가 $189.82, +35%)\nPEG 0.68 — 이 성장률에 이 가격?\n\n상세 분석 👉 investory.kro.kr"
  },
  "telegram": {
    "hook": "NVIDIA 실적 D-4, 삼중 촉매가 몰려온다",
    "text": "📊 오늘의투자 NVIDIA (2/21)\n\n- Meta 수백만 대 GPU 다년 계약 체결\n- OpenAI $300억 투자 거의 확정\n- GB300: Hopper 대비 50배 효율·35배 비용절감\n- Q4 컨센서스 $656억(+67%), 초과 달성 전망\n\n⚠️ 옵션 시장 ±7% 변동 내재 | 중국 점유율 8%로 급락\n🔑 핵심: Q1 가이던스 $750억 달성 여부\n\n🎯 목표가 $256 (현재가 $189.82 대비 +35%)\nForward P/E 26.9 · PEG 0.68\n\n39명 중 37명 매수 의견. 촉매는 충분하지만 Q1 가이던스가 분수령.\n\n상세 분석 👉 investory.kro.kr"
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
