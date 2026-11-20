# 톡송장 3초 — 카톡 주문 → 택배 송장 CSV

> A free Korean browser tool that turns pasted KakaoTalk order messages into a
> courier-ready spreadsheet: recipient, phone, postal code, base address, detail
> address, product, quantity, delivery memo and special flags are split out
> automatically, then exported as the fixed 9-column thermal-label sheet
> (감열식 4B-2054N) or for CJ대한통운, 로젠, 한진, 롯데, 우체국, SmartStore.
> It reads eight real-world order shapes (multi-address, split bubbles, corrections,
> regulars, odd notation, nicknames, island shipping, photo orders) and gates each
> row red / yellow / green before export.
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
  Excel. Optional `입금자명` / `발송인` columns can be appended.
- Fixed 9-column standard sheet (recommended default): 수취인명, 연락처, 우편번호,
  기본주소, 상세주소, 품목명, 수량, 배송메시지, 특수플래그.

## Eight real-world order shapes

1. **One buyer, several destinations** — `1개는 우리집(주소), 2개는 어머니댁(주소 이름 전화)`
   becomes one row per destination; if the split quantities do not add up to the stated
   total the row is held red (`[수량불일치]`). `보내는 분` lands in 발송인, never the recipient.
2. **Split bubbles** — messages from the same speaker within 5 minutes are merged into one
   order before parsing; a 6-minute gap starts a new one.
3. **Corrections** — `3박스로 바꿀게요` / `취소할게요` apply the last value, flag
   `[정정발화]` in yellow and keep the original conversation for review.
4. **Regulars** — `저번 주소로 2박스만요` is never guessed: name and quantity are taken,
   the row is isolated red with `[단골확인필요]`.
5. **Odd notation** — `010.1234.5678` is normalised, `105-802` becomes `105동 802호`, and
   addresses are split into base/detail (road numbers like `123-4` are left alone).
6. **Nicknames** — 수취인 / 발송인 / 입금자 stay separate; `사랑맘`, `ㅇㅇ맘`, `공주`,
   emoji or heart names get a yellow `[닉네임주의]`.
7. **Island & delivery conditions** — 제주/울릉/신안/완도 and similar are tagged
   `[도서산간 +추가운임]`; `금요일 도착`, `아이스팩`, `현관비번` go to the memo with a
   warning once the memo passes 50 characters (with the actual count).
8. **Photo orders** — `[사진]`/capture-only messages are kept as a red `[사진확인필요]`
   row instead of being dropped or guessed. Identical recipient+phone+address+product
   pairs are tagged `[중복의심]`.

Red rows block CSV download; yellow rows are exported with their flag; green rows need
no attention.

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

- Postal codes are not looked up: the 행정안전부 road-name address API needs a free key
  and a server call, so the column stays blank unless the order already carries it
  (`우편번호: 06236`) or the user fills it in the table.
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
- `tests/runner.html`, `tests/cases.js`, `tests/parser.test.js` — 165 parser assertions
- `tests/run-local.py` — same cases headless through QuickJS (`python3 tests/run-local.py`)
- `sitemap.xml`, `robots.txt`, `llms.txt`, `icons/favicon.svg`, `og-image.png`

## Running the tests

```
python3 -m http.server 8080      # 저장소 루트에서
open http://localhost:8080/kakao-invoice/tests/runner.html
```

The page prints `ALL PASS — 165/165` and exposes `window.__TEST_RESULTS`.
Headless: `python3 tests/run-local.py` (needs `pip install quickjs`).
