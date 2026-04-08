# JSON Report Structure

Write collected data as JSON following the `StockAnalysisReport` interface in `src/data/analysis/types.ts`.

```jsonc
{
  "symbol": "TSLA",
  "companyName": "Tesla, Inc.",
  "analysisDate": "2026-02-18",
  "currentPrice": 409.38,
  "marketCap": "$1.55T",

  "businessSummary": {
    "oneLiner": "한 줄 설명",
    "description": "상세 설명 (초보자 친화적)",
    "howTheyMakeMoney": ["매출원 1", "매출원 2"],
    "keyProducts": ["제품 1", "제품 2"]
  },

  // ~6개 지표. P/E는 반드시 비교 기준 포함 (업종 평균, S&P 500 평균, 경쟁사)
  // 예: "반도체 업종 평균(35x)보다 높지만, 65% 성장률 감안 시 PEG 0.73으로 합리적"
  "keyMetrics": [
    { "name": "P/E (TTM)", "value": "47.7x", "interpretation": "비교 기준 포함 해석" }
  ],

  "growthDrivers": [{ "title": "제목", "description": "설명" }],

  "competitiveAdvantage": {
    "summary": "요약",
    "moats": [{ "type": "유형", "description": "설명" }],
    "competitors": [{ "name": "경쟁사", "detail": "상세" }]
  },

  // 최신 5개, 최신순
  "recentNews": [
    { "date": "2026-02-16", "headline": "제목", "significance": "의미", "url": "https://..." }
  ],

  "analystOpinions": {
    "consensusTarget": 43.0, "highTarget": 47.0, "lowTarget": 39.0,
    "upsidePercent": 105, "buyCount": 2, "holdCount": 0, "sellCount": 0,
    "notableComment": "주목할 코멘트"
  },

  // severity: "critical" | "high" | "medium" | "low"
  "risks": [{ "severity": "critical", "title": "제목", "description": "설명" }],

  "buyReasons": [{ "title": "제목", "rationale": "근거" }],

  "technicalPosition": {
    "week52High": 161.0, "week52Low": 3.2, "currentPositionPercent": 11.3,
    "sma50": 31.35, "sma50Signal": "below",
    "sma200": 32.0, "sma200Signal": "below",
    "rsi": 42.72, "rsiSignal": "neutral"
  },

  // 3-4개, 총 350-400자(한국어). 간결한 완전한 문장.
  // 순서: 이벤트/촉매/매크로 먼저 → 주가/기술적 분석 마지막
  // 초보자 이해 가능하게: 약어 풀어쓰기, 원인-결과 연결, 키워드 나열 금지
  // Bad: "NHTSA FSD 데이터 마감 D-2" → Good: "미국 도로교통안전청의 자율주행 심사 마감이 이틀 남았다"
  // Bad: "200일 SMA $392 지지" → Good: "최근 200일 평균 주가($392) 근처에서 버티는 중"
  "overallOpinion": ["문장1", "문장2", "문장3"],

  // 최종 투자 판단. stance: "strong-buy"|"buy"|"hold"|"sell"|"strong-sell"
  "investmentVerdict": {
    "stance": "buy",
    "summary": "근거 포함 2-3문장의 주관적 결론 (초보자 이해 가능하게)",
    "horizon": "3-6개월"
  },

  // 최소 8개
  "sources": [{ "name": "출처명", "url": "https://...", "description": "설명" }]
}
```
