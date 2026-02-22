---
name: deploy
description: investory 운영 서버에 배포. 로컬 빌드 → rsync 전송 → systemctl 재시작. 배포 요청 시 자동 적용.
argument-hint: "(옵션 없음)"
allowed-tools: Bash, Read
user-invocable: true
---

# Investory 배포 스킬

로컬에서 빌드하고 investory 운영 서버(`/opt/investory`)에 배포한다.

## 절대 금지

- **investory 서버에서 `next build` 실행 금지** (RAM 503MB, OOM 발생)
- **`/opt/investory/` 외 경로에 배포 금지** (`~/investory/`는 서비스에 반영 안 됨)

## 배포 절차

### 1. 클린 빌드 (로컬)

```bash
rm -rf .next && npm run build
```

빌드 실패 시 중단. 타입 에러를 먼저 수정한다.

### 2. 결과물 전송

```bash
rsync -azP .next/standalone/ investory:/opt/investory/
rsync -azP .next/static/ investory:/opt/investory/.next/static/
rsync -azP data/ investory:/opt/investory/data/
rsync -azP .env.production investory:/opt/investory/.env.production
```

> **주의**: `.env.production`은 로컬에 보관하며 rsync로 서버에 전송한다. git에는 절대 커밋하지 않는다 (`.gitignore`에 `.env.*` 패턴으로 차단됨).

### 3. 서비스 재시작 + 확인

```bash
ssh investory "sudo systemctl restart investory && sudo systemctl status investory"
```

`active (running)` 확인 후 헬스체크:

```bash
ssh investory "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/"
```

200 응답이면 배포 완료.

## 참고

- systemd 서비스: `investory`
- 리버스 프록시: Caddy
- 도메인: `https://investory.kro.kr`
- 상세: `DEPLOYMENT.md`
