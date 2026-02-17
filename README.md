# Thistory

미국 주식 심층 분석 및 투자 점수 산출 플랫폼.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, next-themes (다크/라이트)
- **Data**: TanStack Query, ioredis (in-memory fallback)
- **Charts**: Lightweight Charts (TradingView)
- **API**: Finnhub, Alpha Vantage

## 로컬 개발

```bash
npm install
cp .env.example .env   # API 키 설정
npm run dev             # http://localhost:3000
```

## 프로덕션 배포 (Oracle Cloud)

```bash
# 빌드
NEXT_PUBLIC_BASE_URL="https://thistory.o-r.kr" npx next build

# 배포
rsync -avz --delete .next/standalone/ thistory:/opt/invest/
rsync -avz .next/static/ thistory:/opt/invest/.next/static/

# 재시작
ssh thistory "sudo systemctl restart invest"
```

## 서버 구성

| 항목 | 값 |
|---|---|
| 호스트 | `ssh thistory` (168.107.13.0) |
| OS | Oracle Linux 9.7, 503MB RAM |
| Node.js | v22 (바이너리 설치) |
| 프록시 | Caddy v2 (자동 HTTPS) |
| 서비스 | systemd: `invest`, `caddy` |

## 서버 로그

```bash
ssh thistory "sudo journalctl -u invest -f"
ssh thistory "sudo journalctl -u caddy -f"
```

## 주요 경로

| URL | 설명 |
|---|---|
| `/` | 랜딩 페이지 |
| `/analysis` | 일별 분석 리포트 목록 |
| `/stock/TSLA` | 종목 상세 (실시간 시세, 점수, 차트) |
| `/stock/TSLA/analysis` | 종목별 분석 히스토리 |
| `/stock/TSLA/analysis/2026-02-18` | 개별 분석 리포트 |
| `/compare?symbols=TSLA,NVDA` | 종목 비교 |
| `/api/analysis/telegram` | 텔레그램 리포트 API |
