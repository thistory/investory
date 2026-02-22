<div align="center">

# Investory

### *Invest + Story = Investory*

**모든 주식에는 이야기가 있습니다. 우리는 그 이야기를 읽어드립니다.**

Investory는 시장 데이터를 명확하고 실행 가능한 투자 이야기로 바꿔줍니다 — 5가지 핵심 축으로 종목을 평가해 감정이 아닌 정보에 기반한 결정을 돕습니다.

[![Live Demo](https://img.shields.io/badge/Live-investory.kro.kr-blue?style=for-the-badge)](https://investory.kro.kr)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[English](README.md)

</div>

---

## Investory란?

대부분의 주식 스크리너는 숫자를 나열합니다. Investory는 그 숫자가 **무엇을 의미하는지** 알려줍니다.

장기 투자자에게 가장 중요한 5가지 차원으로 종목을 평가하는 **5-Pillar Scoring System**을 구축했습니다:

| 축 | 비중 | 측정 항목 |
|----|------|----------|
| **Quality** | 30% | 수익성, 재무 건전성, 실적 일관성 |
| **Moat** | 25% | 가격 결정력, 시장 지위, 경쟁 우위 지속성 |
| **Value** | 20% | 밸류에이션 배수, 안전마진, 가격 포지션 |
| **Growth** | 15% | 과거 성장률, 애널리스트 전망, 성장 품질 |
| **Momentum** | 10% | 가격 추세, 기술적 지표, 거래량 시그널 |

각 종목은 최종 등급(**A+ ~ F**)과 함께 숫자가 아닌 사람이 읽을 수 있는 인사이트를 제공합니다.

## 주요 기능

- **투자 스코어 카드** — 종목별 5축 분석과 실행 가능한 인사이트
- **일별 분석 리포트** — 사업 모델, 성장 동력, 리스크를 다루는 AI 분석 보고서
- **실시간 시세** — Finnhub 기반 실시간 가격 정보
- **인터랙티브 차트** — TradingView 캔들스틱 + Recharts 재무 시각화
- **종목 비교** — 다중 종목 병렬 분석
- **기술적 지표** — RSI, MACD, 볼린저밴드, 이동평균선
- **밸류에이션 지표** — P/E, P/B, P/S, EV/EBITDA (섹터 벤치마크 포함)
- **다크 / 라이트 모드** — 완전한 테마 지원
- **다국어** — 한국어, 영어 (ko/en)
- **모바일 퍼스트** — 모든 화면 크기에 대응하는 반응형 디자인

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript 5.9 |
| 스타일링 | Tailwind CSS 3.4, next-themes |
| 상태 관리 | TanStack Query (서버), Zustand (클라이언트) |
| 차트 | Lightweight Charts (TradingView), Recharts |
| 인증 | Auth.js v5 (Google OIDC), JWT 세션 |
| 데이터베이스 | Neon PostgreSQL (서버리스), Drizzle ORM |
| 캐시 | Redis (ioredis) |
| 다국어 | next-intl (ko/en) |
| 데이터 | Finnhub, Alpha Vantage |

## 시작하기

### 사전 준비

- Node.js 18+
- Redis (선택사항, 캐싱용)
- API 키: [Finnhub](https://finnhub.io/), [Alpha Vantage](https://www.alphavantage.co/)

### 설치

```bash
git clone https://github.com/thistory/investory.git
cd investory
npm install
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
# 데이터 API
FINNHUB_API_KEY=your_finnhub_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# 인증 (Google OAuth)
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# 데이터베이스
DATABASE_URL=your_neon_database_url

# Redis (선택사항)
REDIS_URL=redis://localhost:6379
```

### 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## 프로젝트 구조

```
src/
├── app/              # 페이지 & API 라우트 (App Router)
├── components/       # UI, 차트, 주식, 레이아웃 컴포넌트
│   ├── layout/       # Navbar, LocaleSwitcher
│   ├── stock/        # ScoreCard, PriceChart, AnalysisReport, ...
│   └── ui/           # 공통 UI 프리미티브
├── lib/              # 서비스, 스코어링 엔진, 캐시, 인증
├── hooks/            # 커스텀 React 훅
├── stores/           # Zustand 스토어
├── types/            # TypeScript 타입 정의
├── i18n/             # 다국어 설정
└── data/analysis/    # 분석 리포트 타입 & 로더

data/analysis/reports/ # 종목별 분석 JSON (자동 스캔)
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run db:generate` | Drizzle 마이그레이션 생성 |
| `npm run db:migrate` | 데이터베이스 마이그레이션 실행 |
| `npm run db:push` | 스키마를 데이터베이스에 푸시 |

## 기여하기

기여를 환영합니다! 버그 수정, 새 기능, 스코어링 알고리즘 개선 등 어떤 형태든 좋습니다.

1. 저장소를 **Fork** 합니다
2. 기능 브랜치를 **생성**합니다 (`git checkout -b feat/amazing-feature`)
3. 변경사항을 **커밋**합니다 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 **푸시**합니다 (`git push origin feat/amazing-feature`)
5. **Pull Request**를 엽니다

### 기여 아이디어

- 새로운 데이터 소스 추가 (SEC 파일링, 어닝 콜 트랜스크립트, ...)
- 더 정교한 지표로 스코어링 알고리즘 개선
- 한국어/영어 외 새로운 언어 추가
- 커스텀 필터가 있는 종목 스크리너 구축
- 포트폴리오 추적 기능 추가
- 접근성(a11y) 개선
- 테스트 작성

## 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다 — 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

<div align="center">

**[investory.kro.kr](https://investory.kro.kr)**

시장과 코드에 대한 호기심으로 만들었습니다.

</div>
