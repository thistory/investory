# CLAUDE.md — Investory Project

## Commit Convention

> **All commit messages must be written in English.**
>
> Follow the Conventional Commits format:
>
> ```
> <type>: <short summary in English>
> ```
>
> **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`
>
> Examples:
> - `feat: add stock comparison page`
> - `fix: resolve dark mode flickering on mobile`
> - `docs: update README with contribution guide`
> - `refactor: extract scoring logic into separate module`

## UI 개발 필수 체크리스트

> **모든 UI 변경 시 아래 3가지를 반드시 확인할 것.**
>
> ### Dark / Light 모드
> - 모든 UI 요소에 라이트(`text-gray-*`, `bg-gray-*`)와 다크(`dark:text-zinc-*`, `dark:bg-zinc-*`) 클래스 모두 적용
> - 다크 전용 또는 라이트 전용 색상 하드코딩 금지
>
> ### 다국어 (ko / en)
> - 사용자에게 보이는 모든 텍스트는 `useTranslations()` 또는 `getTranslations()` 사용
> - 한국어/영어 문자열 하드코딩 금지
>
> ### 반응형 (PC / 모바일)
> - 모바일(< 640px)과 데스크톱 모두에서 레이아웃 확인
> - `sm:` / `md:` / `lg:` 브레이크포인트 활용
> - 모달은 어떤 뷰포트에서도 부모 컨테이너를 벗어나지 않도록 할 것
