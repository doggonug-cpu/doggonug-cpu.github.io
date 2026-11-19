# Copilot instructions - senior-first UI (A11yKit)

This repository builds interfaces for older and low-vision users. Apply these rules to
every suggestion you make for HTML, CSS, JS and component code.

## Non-negotiables
1. Touch and click targets >= 48x48 CSS px; primary actions 56-64px; >= 12px gaps.
2. Focus ring 4px #FFE066, 3px offset, :focus-visible only, never clipped.
3. Body text contrast >= 7:1 (AAA). Reference: #F3F6F9 on #06090F = 18.4:1.
4. Base font 19px, line-height 1.6, line length <= ~72ch, no justified text.
5. Korean: word-break: keep-all.
6. State never conveyed by colour alone - add icon, word, weight or underline.
7. Real semantic elements; visible label above every field, tied with for/id.
8. role="status" aria-live="polite" for status changes; role="alert" only for errors.
9. Dialogs are <dialog>.showModal(); Escape closes; focus returns to the trigger.
10. Works at 200% zoom and 320px width with no horizontal scroll.

## Avoid
- div or span as a button, placeholder-only labels, hidden focus outlines.
- Colour-only success/error/selected states, animated transitions that ignore
  prefers-reduced-motion, layout shifts when a message appears.
- Audio files, CDN scripts, trackers, external font or icon requests.
- Inventing component markup: reuse the A11yKit ids instead.

## Done means
Keyboard-only walkthrough, screen-reader pass, 200% zoom and 320px check, contrast
measured, zero console errors, and the list of A11yKit component ids reused.

Component index: https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt
