# CLAUDE.md - senior-first UI rules (A11yKit)

This project targets older and low-vision users. Follow these rules for every UI
change; they override stylistic defaults and library conventions.

## Targets and focus
- Interactive elements >= 48x48 CSS px, primary actions 56-64px tall, >= 12px gaps.
- Focus: 4px solid #FFE066 ring, 3px offset, :focus-visible only, never clipped.
- Keyboard order = visual order. No keyboard traps, no focus loss on close.

## Text and contrast
- Body text >= 7:1 contrast (AAA); reference #F3F6F9 on #06090F = 18.4:1.
- Secondary text >= 4.5:1. Base font 19px, line-height 1.6, <= ~72ch per line.
- Korean: word-break: keep-all. Survive 200% zoom and 320px width with no horizontal scroll.
- State is never colour-only: pair colour with icon, word, weight or underline.

## Semantics
- Real button/a/input/dialog; visible label above each field tied with for/id.
- role="status" aria-live="polite" for status, role="alert" only for errors.
- Radio groups: fieldset/legend or role="radiogroup" + aria-checked + roving tabindex.
- <dialog>.showModal() for modals; Escape closes; focus returns to trigger.
- aria-pressed / aria-checked / aria-current / aria-expanded expose state.

## Sound and motion
- Optional Web Audio tones only (no files, <= 1 per 80ms) with a persistent mute switch,
  always mirrored in visible text and the live region.
- Honour prefers-reduced-motion. Reserve space so messages never shift layout.

## Code
- Plain HTML + CSS + one vanilla JS block unless the project already uses a framework.
- No CDN, no telemetry, no external requests. CSS custom properties for colour/spacing.

## Done means
- Full keyboard walkthrough, screen-reader pass, 200% zoom and 320px check, contrast
  measured, zero console errors, zero failed requests.
- List the A11yKit component ids reused. If you need the exact source, ask for it with
  the a11y-kit MCP tools (list_components, get_component, get_ai_prompt,
  check_wcag_checklist) instead of inventing markup.

Component index: https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt
