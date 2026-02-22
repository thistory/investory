# Investory

[English](README.md)

미국 주식 심층 분석 및 투자 점수 산출 플랫폼.

## 기술 스택

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 3.4, next-themes
- **State**: TanStack Query (서버), Zustand (클라이언트)
- **Charts**: Lightweight Charts (TradingView), Recharts
- **Cache**: Redis (ioredis)
- **API**: Finnhub, Alpha Vantage

## 로컬 개발

```bash
npm install
cp .env.example .env   # API 키 설정
npm run dev            # http://localhost:3000
```

## 주요 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |

## 주요 경로

| URL | 설명 |
|-----|------|
| `/` | 랜딩 페이지 |
| `/analysis` | 일별 분석 리포트 목록 |
| `/stock/{SYMBOL}` | 종목 상세 (시세, 점수, 차트) |
| `/stock/{SYMBOL}/analysis` | 종목별 분석 히스토리 |
| `/stock/{SYMBOL}/analysis/{date}` | 개별 분석 리포트 |
| `/compare?symbols=A,B` | 종목 비교 |
| `/api/analysis/telegram` | 텔레그램 리포트 API |

## 프로젝트 구조

```
src/
├── app/              # 페이지 & API 라우트
├── components/       # UI, 차트, 주식, 스크리너
├── lib/              # 서비스, 스코어링, 캐시
├── hooks/            # 커스텀 훅
├── stores/           # Zustand 스토어
├── types/            # TypeScript 타입
└── data/analysis/    # 분석 리포트 타입 & 로더
data/analysis/reports/ # 종목별 분석 JSON (자동 스캔)
```

## 배포

[DEPLOYMENT.md](DEPLOYMENT.md) 참고
