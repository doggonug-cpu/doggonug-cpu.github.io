# 톡송장 3초 — 카톡 주문 → 택배 송장 CSV

> A free Korean browser tool that turns pasted KakaoTalk order messages into a
> courier-ready spreadsheet: recipient, phone, address, product, quantity, delivery
> memo and depositor are split out automatically, then exported as CSV for
> CJ대한통운, 로젠, 한진, 롯데, 우체국 or as SmartStore bulk-upload columns.
> No account, no server: the text is parsed in the browser only.
> Live: https://doggonug-cpu.github.io/kakao-invoice/

## What it does

- Splits many orders out of one pasted block: numbered lists (`1.`, `2)`, `①`),
  blank lines, `---` separators, and KakaoTalk export headers
  (`--------------- 2024년 5월 12일 ---------------`, `[김미숙] [오전 9:12]`,
  `2024년 5월 12일 오후 3:12, 김미숙 :`).
- Recognises labelled fields (`이름:`, `연락처:`, `주소:`, `상품:`, `수량:`,
  `배송메모:`, `입금자:`) in colon, comma, slash or newline form, and free-form lines
  like `김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 5kg 2박스`.
- Normalises phone numbers (`01012345678`, `010 1234 5678`, `+82 10-1234-5678`
  → `010-1234-5678`) and flags wrong digit counts instead of guessing.
- Separates count units (`2박스`, `3장`, `1세트`) into the quantity column and keeps
  weight units (`5kg`) inside the product name.
- Marks missing name, missing/short address, missing phone and bad phone numbers on
  the row and on the exact field, and every cell is editable in place.
- Exports a UTF-8 BOM CSV per courier column order, or copies tab-separated text for
  Excel. An optional `입금자명` column can be appended.

## Privacy

- No network request is made with order data. Parsing, editing, CSV building and
  clipboard copy all run in the page. Nothing is stored (no localStorage).
- The only form that sends anything is the Pro waitlist form (email, optional phone,
  order volume), posted through FormSubmit to the operator's mailbox.

## Free vs Pro

- Free and unlimited: conversion, five couriers + SmartStore format, CSV and TSV.
- Pro (₩19,000/month, not released yet — waitlist only): per-client custom order
  forms, bulk extraction from exported KakaoTalk `.txt`, bundle-shipment guard.

## Limits (stated on the page)

- Column names follow each courier's publicly listed acceptance fields; they are a
  standard shape, not a guarantee of the courier's current upload template.
- SmartStore export is the four-column waybill registration format
  (`상품주문번호, 배송방법, 택배사, 송장번호`), so order numbers must be filled in.
- Pro is a pre-launch waitlist; no payment is taken.

## Files

- `index.html` — page, SEO metadata, JSON-LD (SoftwareApplication, FAQPage)
- `styles.css` — all styling, CSS variables, no external fonts
- `parser.js` — dependency-free parser + CSV/TSV builders (browser global and CommonJS)
- `app.js` — table rendering, in-place editing, exports, waitlist form
- `tests/runner.html`, `tests/parser.test.js` — 73 parser assertions, run in a browser
- `sitemap.xml`, `robots.txt`, `llms.txt`, `icons/favicon.svg`, `og-image.png`

## Running the tests

```
python3 -m http.server 8080      # 저장소 루트에서
open http://localhost:8080/kakao-invoice/tests/runner.html
```

The page prints `ALL PASS — n/n` and exposes `window.__TEST_RESULTS`.
