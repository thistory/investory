# 배포

## 서버
- **빌드 서버**: AWS (openclaw@ip-172-26-9-41), 경로: `~/.openclaw/workspace/investory`
- **운영 서버**: Oracle Cloud, `ssh thistory`, 경로: `/opt/investory`
- systemd: `investory`
- 리버스 프록시: Caddy
- 도메인: `https://investory.kro.kr`

## ⚠️ 빌드는 반드시 AWS에서!
thistory 서버는 RAM 503MB라서 Next.js 빌드 시 OOM 발생함.
**절대로 thistory에서 `next build` 하지 말 것.**

## 배포 명령어 (AWS 서버에서 실행)

```bash
cd ~/.openclaw/workspace/investory

# 1. 클린 빌드 (AWS에서)
rm -rf .next && npx next build

# 2. 결과물 전송
rsync -azP .next/standalone/ thistory:/opt/investory/
rsync -azP .next/static/ thistory:/opt/investory/.next/static/
rsync -azP data/ thistory:/opt/investory/data/

# 3. 재시작
ssh thistory "sudo systemctl restart investory"
```

## 자동 배포 (OpenClaw cron)
- 매일 아침 8시 KST, TSLA/BMNR 분석 리포트 생성 → AWS 빌드 → thistory 배포
- cron job 이름: `investory:daily-report`

## 주의사항
- 반드시 `/opt/investory/`로 배포 (`~/investory/`는 서비스에 반영 안 됨)
- 새 JSON 추가 시 `rm -rf .next` 클린 빌드 필수 (Turbopack 캐시 미감지)
- 분석 리포트는 `data/analysis/reports/{SYMBOL}/{날짜}.json`에 추가하면 자동 스캔
