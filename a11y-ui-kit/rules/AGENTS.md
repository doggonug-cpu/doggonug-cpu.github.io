# AGENTS.md - senior-first UI rules (A11yKit)

Applies to any coding agent working in this repository: Codex, Gemini CLI, Cline, Zed,
Devin, or a custom runner. Read this before editing UI files.

## Constraints
- Targets >= 48x48 CSS px (56-64px primary), >= 12px apart, no scale() hit areas.
- Focus ring 4px #FFE066 with 3px offset on :focus-visible, never clipped.
- Body text >= 7:1 contrast; secondary >= 4.5:1; 19px base, 1.6 line-height, <= ~72ch.
- Korean: word-break: keep-all. No mid-word breaks, no justified text.
- 200% zoom and 320px width must stay usable without horizontal scrolling.
- Colour is never the only state signal.
- Semantic HTML first; labels above fields tied with for/id; no placeholder-only labels.
- Status via role="status" aria-live="polite"; errors via role="alert".
- Choice groups: fieldset/legend or role="radiogroup" + aria-checked + roving tabindex.
- Modals: <dialog>.showModal(), Escape closes, focus returns to the trigger.
- Optional sound: Web Audio tones only, mute switch persisted, mirrored in text.
- prefers-reduced-motion respected; no layout shift when messages appear.
- Plain HTML + CSS + one vanilla JS block; no CDN, no tracker, no external request.

## Verify before finishing
1. Keyboard-only walkthrough of the whole flow.
2. Screen reader: names, roles, states, announcements.
3. 200% zoom, 320px width: no horizontal scroll.
4. Contrast measured per text/background pair.
5. Zero console errors, zero failed requests.
6. Report the A11yKit component ids reused.

If you need exact source or a WCAG checklist, use the a11y-kit MCP server:
list_components, get_component, get_ai_prompt, check_wcag_checklist.
Index: https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt
