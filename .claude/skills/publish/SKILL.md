---
name: publish
description: 종목분석 리포트 생성 + 빌드 + 배포를 한 번에 실행. 수동 실행 또는 크론 등록으로 자동화. 데이터 수집(코드) → 분석(LLM) → 후처리(코드) → 빌드 → 배포.
argument-hint: "[TICKER...] (생략 시 추적 종목 전체)"
allowed-tools: WebSearch, WebFetch, Read, Write, Edit, Bash, Task, Grep, Glob
---

# Publish

종목분석 리포트 생성부터 배포까지 한 번에 실행한다.

## Input

- `$ARGUMENTS`: 티커 (e.g., `TSLA`, `TSLA NVDA PLTR`)
- 생략 시: `data/analysis/reports/` 하위 디렉토리명 전체 (추적 종목)

## Pipeline

```
1. 데이터 수집 (코드)     → scripts/fetch-stock-data.js
2. 분석 (LLM, 병렬)      → 한국어 리포트 + SNS
3. 영어 번역 (LLM, 병렬)  → haiku로 번역
4. 후처리 (코드)          → scripts/finalize-report.js
5. 빌드 + 배포 (코드)     → npm run build → rsync → restart
```

### Step 1: 데이터 수집

```bash
node scripts/fetch-stock-data.js {TICKERS...}
```

### Step 2: 한국어 분석 (병렬)

티커별 1개 에이전트를 `model: "sonnet"`, `run_in_background: true`로 동시 실행.

각 에이전트 프롬프트에 포함할 내용:
- 티커, 오늘 날짜
- 캐시 데이터 경로: `.cache/analysis/{SYMBOL}.json`
- 이전 리포트 경로: `data/analysis/reports/{SYMBOL}/` (최신 `.json`)
- "Read `.claude/skills/stock-analysis/refs/json-schema.md` for schema"
- "Read `.claude/skills/stock-analysis/refs/sns-format.md` for SNS format"
- 업데이트 시 웹 검색 2-3회, 신규 4-6회
- businessSummary, growthDrivers, competitiveAdvantage는 기존 리포트에서 재사용
- fact 톤 생성 금지 (finalize 스크립트가 처리)
- 출력: `data/analysis/reports/{SYMBOL}/{date}.json`
- 작성 규칙: em dash/가운뎃점 금지, 초보자 친화, P/E 비교 기준 필수, 소스 8개+

### Step 3: 영어 번역 (병렬)

Step 2 완료 후, 티커별 1개 에이전트를 `model: "haiku"`, `run_in_background: true`로 동시 실행.

각 에이전트 프롬프트:
- 한국어 리포트 경로 전달
- "Read `.claude/skills/stock-analysis/refs/sns-format.md`"
- Bloomberg/WSJ 톤, 직역 금지, fact 톤 생성 금지
- 출력: `data/analysis/reports/{SYMBOL}/{date}.en.json`

### Step 4: 후처리

각 티커에 대해 순차 실행:

```bash
node scripts/finalize-report.js {SYMBOL} {DATE}
```

### Step 5: 빌드 + 배포

```bash
npx tsc --noEmit
rm -rf .next && npm run build
rsync -azP .next/standalone/ investory:/opt/investory/
rsync -azP .next/static/ investory:/opt/investory/.next/static/
rsync -azP data/ investory:/opt/investory/data/
rsync -azP .env.production investory:/opt/investory/.env.production
ssh investory "sudo systemctl restart investory && sudo systemctl status investory"
ssh investory "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
```

200 또는 307 응답이면 배포 완료. 실패 시 원인 보고.
