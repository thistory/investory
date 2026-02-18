# 배포

## 서버
- Oracle Cloud, `ssh thistory`
- systemd: `investory` / 경로: `/opt/investory`
- 리버스 프록시: Caddy
- 도메인: `https://thistory.o-r.kr`

## 배포 명령어

```bash
# 1. 클린 빌드
rm -rf .next && npm run build

# 2. 전송
rsync -azP --delete .next/standalone/ thistory:/opt/investory/
rsync -azP --delete .next/static/ thistory:/opt/investory/.next/static/
rsync -azP data/ thistory:/opt/investory/data/

# 3. 재시작
ssh thistory "sudo systemctl restart investory"
```

## 주의사항
- 반드시 `/opt/investory/`로 배포 (`~/investory/`는 서비스에 반영 안 됨)
- 새 JSON 추가 시 `rm -rf .next` 클린 빌드 필수 (Turbopack 캐시 미감지)
- 분석 리포트는 `data/analysis/reports/{SYMBOL}/{날짜}.json`에 추가하면 자동 스캔
