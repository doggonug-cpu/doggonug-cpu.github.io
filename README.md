# doggonug-cpu.github.io

Small, static, no-signup tools built in Wando, Republic of Korea — published as a GitHub
Pages user site at <https://doggonug-cpu.github.io>. No framework, no bundler, no tracking,
no server-side storage.

**한국어** — 완도에서 만드는 작은 정적 웹도구 모음입니다. 회원가입·추적·서버 저장이 없고,
모든 계산과 문서 작성은 방문자의 브라우저에서만 이뤄집니다. 아래 네 서비스는 지금 바로
쓸 수 있고, AI 에이전트용 인덱스(`llms.txt`)와 MCP 서버도 함께 배포합니다.

## Live services

| Project | What it is | For |
| --- | --- | --- |
| [**A11yKit**](https://doggonug-cpu.github.io/a11y-ui-kit/) | 18 senior-first accessible UI components (48px+ targets, 18.4:1 contrast, synthesized sound) + a local MCP server + AI rule packs. 10 components MIT. | AI builders, agencies, kiosk and care teams |
| [**QuickQuote**](https://doggonug-cpu.github.io/quick-quote-pwa/) | 견적서 · 거래명세서 · 간이영수증 in ~10 seconds, printed or saved as PDF. Offline PWA, 20 currencies, KO/EN. | Small businesses, freelancers, on-site sales |
| [**한울에듀테크 AI kit**](https://doggonug-cpu.github.io/edutech-ai-kit/) | Free 40-minute AI-literacy lesson kit (plan, command cards, worksheet) for age 5–grade 2, zero devices needed. | Teachers, digital tutors, kindergarten staff |
| [**마진계산기**](https://doggonug-cpu.github.io/seller-margin-pseo/) | Net-profit, margin and break-even price across 21 Korean sales channels, incl. VAT, ads and returns. | Sellers, freelancers, own-shop owners |

## Also running

- [**한미 공시 3줄 요약**](https://t.me/good_gongsi) — a free Telegram channel posting five Korean
  and US filings as three factual lines twice a day. Custom keyword/ticker alert bots are quoted at
  <https://doggonug-cpu.github.io/#disclosure> (software build; not investment advice).

## For AI agents

- Hub index: <https://doggonug-cpu.github.io/llms.txt>
- A11yKit index: <https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt> · full text:
  <https://doggonug-cpu.github.io/a11y-ui-kit/llms-full.txt>
- MCP descriptor: <https://doggonug-cpu.github.io/a11y-ui-kit/mcp/server.json> ·
  discovery: <https://doggonug-cpu.github.io/.well-known/mcp.json>
- Rule files: <https://doggonug-cpu.github.io/a11y-ui-kit/ai-rules.json>

`robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
Google-Extended and the other main AI crawlers.

## Repository notes

- 이 저장소는 **완도애협동조합 공식 사이트가 아닙니다.** 조합 사이트는 별도 저장소
  [`doggonug-cpu/wandoae`](https://github.com/doggonug-cpu/wandoae) 이며
  <https://wandoae.me> 에서 운영됩니다.
- 이 저장소에는 `CNAME` 파일을 두지 않습니다. (같은 도메인을 두 저장소가 주장하면
  GitHub Pages HTTPS 인증서 발급이 중단됩니다.)
- 작업 규칙은 [AGENTS.md](AGENTS.md)를 따릅니다. `main` 푸시가 곧 배포입니다.
