# A11yKit

**Senior-first, WCAG-minded UI components for AI builders — plus a local MCP server that hands your agent the source, the prompt and the checklist.**

[![Live demo](https://img.shields.io/badge/live-demo-FFD84D?style=flat-square)](https://doggonug-cpu.github.io/a11y-ui-kit/)
[![License: MIT (10 components)](https://img.shields.io/badge/free%20tier-MIT-7CF2B0?style=flat-square)](https://doggonug-cpu.github.io/a11y-ui-kit/#faq)
[![MCP](https://img.shields.io/badge/MCP-stdio%20%C2%B7%20zero%20deps-8FC7FF?style=flat-square)](https://doggonug-cpu.github.io/a11y-ui-kit/#mcp)
[![Targets](https://img.shields.io/badge/targets-48px%2B-FFD84D?style=flat-square)](https://doggonug-cpu.github.io/a11y-ui-kit/#c-big-action-button)
[![Contrast](https://img.shields.io/badge/body%20contrast-18.4%3A1-7CF2B0?style=flat-square)](https://doggonug-cpu.github.io/a11y-ui-kit/#faq)

[Live demo](https://doggonug-cpu.github.io/a11y-ui-kit/) · [llms.txt](https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt) · [MCP server](mcp/README.md) · [AI rules pack](https://doggonug-cpu.github.io/a11y-ui-kit/ai-rules.json) · [Request a quote](https://doggonug-cpu.github.io/a11y-ui-kit/#hire)

> **한국어 요약** — 70대의 손과 눈에 맞춘 18종 UI 컴포넌트입니다. 48px 이상 타깃,
> 18.4:1 본문 대비, 오디오 파일 없는 합성 탭 사운드. 무료 10종은 MIT이고 HTML+CSS+JS와
> React 코드를 바로 복사할 수 있습니다. 로컬 MCP 서버가 Claude Code·Cursor·Windsurf에
> 정확한 소스와 구현 프롬프트, WCAG 점검표를 건네며, Cursor·Claude Code·Copilot·
> Windsurf용 규칙 파일도 함께 제공합니다.

## Why this exists

Design systems are tuned for a 25-year-old thumb. When the same library is put in front of
a 74-year-old at a pharmacy kiosk, three things break: targets are too small, contrast is
too low, and nothing tells you whether the press registered. A11yKit moves the baseline.

| | Typical kit | A11yKit |
| --- | --- | --- |
| Minimum target | 32–44px | **48px**, 56–64px for primary actions |
| Body contrast | 4.5:1 (AA) | **18.4:1**, secondary 10.6:1 |
| Focus ring | 2px, often clipped | **4px + 3px offset**, `:focus-visible` only |
| Feedback | colour change | **sound + text + live region** |
| Feedback assets | mp3 files | **synthesized, 0 KB** |
| Korean | afterthought | **keep-all line breaking, KO label sets** |
| For AI agents | a PDF or a docs page | **MCP server + rule files + prompts** |

Honest note: the kit does not claim automated AAA conformance for a whole page. AAA includes
criteria (sign language, images of text, reading level) that only a human audit settles.

## The 18 components

Ten are MIT and free, eight are Pro (preview and spec only). Every free card on the site has
**Copy HTML+CSS+JS**, **Copy React** and **Copy AI prompt**.

| # | Free (MIT) | WCAG |
| --- | --- | --- |
| 01 | Big action buttons + synthesized tap sound | 2.5.5 AAA, 1.4.6 AAA, 2.1.1, 4.1.3 |
| 02 | Text scale + high-contrast switch (persisted) | 1.4.4, 1.4.8 AAA, 2.4.7 AAA, 4.1.2 |
| 03 | Medication checklist with announced count | 1.3.1, 2.5.5 AAA, 4.1.3 |
| 04 | Kiosk choice list, one 64px row per choice | 2.5.5 AAA, 2.1.1, 3.3.2, 4.1.2 |
| 05 | Read-aloud button with rate control and stop | 1.1.1, 4.1.3, 1.4.5 |
| 06 | Two-step confirm switch in a native dialog | 3.3.4 AAA, 3.3.6 AAA, 2.4.3 |
| 07 | Big number keypad with masked display | 2.5.5 AAA, 2.4.7 AAA, 1.4.11 |
| 08 | Success and error banners, tone per state | 1.4.1, 4.1.3, 3.3.1 |
| 09 | Step progress with `aria-current` and speech | 1.3.1, 2.4.8 AAA, 4.1.2 |
| 10 | Senior-friendly form with linked error summary | 3.3.1, 3.3.3 AAA, 3.3.2 |

Pro: voice search with typed fallback, family check-in, hospital timeslots, large-print
receipt, multilingual TTS pack, reminiscence gallery, vitals trend, hold-to-pay.

## Start in one minute

1. Open the [live demo](https://doggonug-cpu.github.io/a11y-ui-kit/) — every demo runs there,
   not a screenshot.
2. Copy a component, or paste the **AI rules pack** into your repo so your agent stops
   guessing:
   - Cursor: `.cursor/rules/a11y-senior-ui.mdc`
   - Claude Code: `CLAUDE.md`
   - Windsurf: `.windsurfrules`
   - Copilot: `.github/copilot-instructions.md`
   - Other agents: `AGENTS.md`

   All five live in [`rules/`](rules/) and come from one source: [`ai-rules.json`](ai-rules.json).
3. Connect the MCP server so the agent reads the real source instead of inventing markup:

```bash
git clone --depth 1 https://github.com/doggonug-cpu/doggonug-cpu.github.io.git
claude mcp add a11y-kit -- node "$PWD/doggonug-cpu.github.io/a11y-ui-kit/mcp/server.mjs"
```

## MCP server — four tools

Local stdio, zero dependencies, read-only, Node 18+, no API key, no network call.

| Tool | Arguments | Returns |
| --- | --- | --- |
| `list_components` | `tier` (`all`/`free`/`pro`), `tag`, `query`, `limit` | The 18 components with tier, tags, WCAG criteria, source availability |
| `get_component` | `id`, `include_code` | HTML+CSS+JS, React source, notes, criteria (Pro → spec + lock notice) |
| `get_ai_prompt` | `id`, `target` (`claude-code`/`cursor`/`lovable`/`generic`), `language` (`en`/`ko`) | A paste-ready implementation prompt |
| `check_wcag_checklist` | `id`, `level` (`all`/`aaa`) | Each criterion with the manual check a human must run |

Client configs for Claude Code, Claude Desktop, Cursor, Windsurf and VS Code are on the
live page under [MCP](https://doggonug-cpu.github.io/a11y-ui-kit/#mcp). Details:
[mcp/README.md](mcp/README.md). Registry descriptor: [mcp/server.json](mcp/server.json).
The npm package is not published yet, so clients point at the cloned file path.

## Screen and target prompt builder

[Builder](https://doggonug-cpu.github.io/a11y-ui-kit/#builder) — pick a screen (kiosk
ordering, welfare application, hospital booking, senior commerce, care record, banking) and
a target group (70+, low vision, touch-uncertain, hearing loss, cognitive support); it
returns the component combination and a paste-ready prompt with the constraints and
acceptance criteria included. A starting point, not a generated app.

## For AI crawlers

- [`llms.txt`](https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt) — short index
- [`llms-full.txt`](https://doggonug-cpu.github.io/a11y-ui-kit/llms-full.txt) — all 18
  components with criteria, notes, MCP contracts, pricing
- [`catalog.json`](catalog.json) — machine-readable, includes full source of the free ten
- [`ai-rules.json`](ai-rules.json) — the five rule files as data
- [`.well-known/mcp.json`](https://doggonug-cpu.github.io/.well-known/mcp.json) — MCP pointer

## Repository layout

```
a11y-ui-kit/
├── index.html          # the site (no framework, no build)
├── styles.css          # design tokens: measured contrast in the header comment
├── app.js              # interactions, i18n (EN/KO), copy, builder
├── catalog.json        # component data + source of the free ten
├── ai-rules.json       # rule packs for five AI tools
├── llms.txt · llms-full.txt
├── rules/              # the same packs as paste-ready files
└── mcp/                # stdio MCP server, server.json, README
```

## Licence

The ten free components are **MIT** — ship them commercially, no attribution required.
Pro components are separately licensed and released only to buyers; nothing in the MCP
server grants Pro access. The MCP server itself is MIT.

## Custom work

Accessibility review against WCAG 2.2 AA with fix snippets; senior, kiosk, booking and
care screens rebuilt with the kit; team and institution licences.
[Request a quote](https://doggonug-cpu.github.io/a11y-ui-kit/#hire) — replies come by
email, and sending the form never charges anything.
