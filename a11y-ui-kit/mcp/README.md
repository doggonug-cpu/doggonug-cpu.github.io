# A11yKit MCP server

A local [Model Context Protocol](https://modelcontextprotocol.io) server for the
A11yKit component catalog: senior-first, WCAG AAA-minded UI components.

Your agent asks for the code, the implementation prompt or the accessibility
checklist and gets it as text. There is no account, no API key, no telemetry and
no network access. The server only reads one JSON file beside itself.

- Node 18 or newer
- Zero dependencies (no `npm install` needed)
- Read-only: it never writes files and never opens a socket

## Install

```bash
git clone https://github.com/doggonug-cpu/doggonug-cpu.github.io.git
cd doggonug-cpu.github.io/a11y-ui-kit/mcp
node server.mjs --selftest      # 9 checks, should print "9 passed, 0 failed"
```

The package is not on npm yet. Point your client at the absolute path of
`server.mjs`.

## Claude Code

```bash
claude mcp add a11y-kit -- node /absolute/path/a11y-ui-kit/mcp/server.mjs
```

## Cursor / any client that reads `mcp.json`

```json
{
  "mcpServers": {
    "a11y-kit": {
      "command": "node",
      "args": ["/absolute/path/a11y-ui-kit/mcp/server.mjs"]
    }
  }
}
```

On Windows use the full path with forward slashes, for example
`C:/tools/a11y-ui-kit/mcp/server.mjs`.

## Tools

| Tool | Arguments | Returns |
| --- | --- | --- |
| `list_components` | `tier` (`all`/`free`/`pro`), `tag`, `query`, `limit` | The 18 components with tier, tags, WCAG criteria and whether source is available |
| `get_component` | `id`, `include_code` | HTML/CSS/JS source, React source, notes, criteria (Pro returns the spec and a lock notice) |
| `get_ai_prompt` | `id`, `target` (`claude-code`/`cursor`/`lovable`/`generic`), `language` (`en`/`ko`) | A paste-ready implementation prompt |
| `check_wcag_checklist` | `id`, `level` (`all`/`aaa`) | Each criterion with the manual check a human must run |

Example id: `big-action-button`. Run `list_components` first if you do not know
the id.

## What the agent should do

1. `list_components` with a tag such as `kiosk` or `care` to find a fit.
2. `get_component` for the source, or `get_ai_prompt` if it will write the code
   itself.
3. `check_wcag_checklist` before shipping, and run the manual checks in a
   browser with a screen reader.

## Data file

The server loads `../catalog.json` (the file the website uses) and falls back to
`components.json` in this folder, so a copied folder still works on its own.
Both files are identical; `components.json` is the self-contained copy.

## Licensing

The ten free components are MIT: copy, modify and ship them commercially, no
attribution required. Pro components return a lock notice instead of source;
their licence is separate. Nothing in this server grants Pro access.

## Protocol notes

- JSON-RPC 2.0 over stdio, one JSON object per line, as the MCP stdio transport
  specifies. Stdout carries protocol messages only; logs go to stderr.
- Supported protocol versions: `2025-06-18`, `2025-03-26`, `2024-11-05`. The
  server echoes the client's version when it is one of these, otherwise it
  answers with the newest.
- Handles `initialize`, `notifications/initialized`, `ping`, `tools/list`,
  `tools/call`, and returns empty lists for `resources/list` and `prompts/list`.

## Quick manual test

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl-test","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_components","arguments":{"tier":"free"}}}' \
  | node server.mjs
```

## Honest limits

The checklist is a set of manual checks, not a conformance certificate. AAA
includes criteria (sign language, image-of-text limits, context-sensitive
reading level) that no automated tool can settle. Run a real audit before you
claim AAA.
