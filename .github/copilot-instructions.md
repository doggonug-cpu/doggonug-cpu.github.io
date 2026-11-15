# Copilot Instructions — `doggonug-cpu.github.io`

> 전체 규칙은 루트의 [`AGENTS.md`](../AGENTS.md). 이 파일은 Copilot 용 요약이며 충돌 시 `AGENTS.md` 우선.

## 정체
GitHub Pages **사용자 사이트**(<https://doggonug-cpu.github.io>). 개인 실험·기록 공간.
**완도애협동조합 공식 사이트 아님** (그쪽은 `doggonug-cpu/wandoae` 저장소, <https://wandoae.me>).

## 절대 금지
- **`CNAME` 파일 생성 금지** — 특히 `wandoae.me`. 2026-11-09 이 저장소의 같은 도메인 CNAME 이
  GitHub Pages 도메인 충돌을 일으켜 `wandoae.me` HTTPS 인증서 발급이 중단됐다.
- `wandoae` 하위 경로 사이트(`/wandoae/`) 생성 금지 — 커스텀 도메인과 중복된다.
- 허위 경력·수상·자격·성과, 가짜 수치·후기 금지.
- 전화번호·주소·생년월일·가족/지인 정보·계좌 등 **개인정보 무단 게시 금지**(사이트는 전 세계 공개).
- API 키·토큰·비밀번호 커밋 금지. 정적 사이트 코드는 전부 공개된다.
- DNS·도메인·Pages 설정 변경, `main` force push, 무단 배포 금지.

## 기술
HTML5 + 순수 CSS(CSS 변수) + Vanilla JS + 인라인 SVG. 프레임워크·번들러·npm·CSS CDN·추적 스크립트 금지.
빌드 없음. 로컬 미리보기 `python3 -m http.server 8080`.

## 작성
시맨틱 마크업, 페이지당 `h1` 하나, `:root` 변수로 색·간격 관리, 반응형 360/640/900/1200px,
접근성 대비 AA·`:focus-visible`·`alt`·`prefers-reduced-motion`, 담백한 존댓말, 과장 금지.

## 커밋
Conventional Commits. 한 커밋 한 변경. 커밋 전 `CNAME` 없음 확인 · 3크기 렌더 확인 · 개인정보/비밀정보 점검.
