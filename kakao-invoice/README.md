# 톡송장 3초 — 카톡 주문 → 택배 송장 CSV

> A Korean browser tool that turns pasted KakaoTalk order messages into a
> courier-ready spreadsheet (free for up to 5 orders per conversion): recipient, phone, postal code, base address, detail
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
  clipboard copy all run in the page. Orders are never stored.
- localStorage holds two things only, neither of them order data: the Pro licence key
  (`ts3.license.v1`, a signed text token) and — for Pro users — the chosen courier and
  column options (`ts3.format.v1`).
- The only form that sends anything is the account-transfer order form (email,
  depositor name, plan), posted through FormSubmit to the operator's mailbox. No bank
  account or phone number is ever printed on the page; it is sent in the reply.

## Free vs Pro

- Free: one conversion of up to **5 orders** with every feature — eight field shapes,
  the red/yellow/green gate, standard 9-column sheet, five couriers + SmartStore, CSV
  and TSV. Conversions themselves are unlimited.
- Pro (₩29,000 / month, ₩79,000 / 3 months, ₩149,000 / 6 months): converting 6+ orders at once, unlimited
  CSV/TSV export, and remembering the courier/column choice in that browser.
- Pro opens with a licence key issued by email and pasted into the page (no account, no
  PG). The key is an ECDSA P-256 signature over its own payload; the page carries only
  the public key and checks it locally, so there is no server and no master secret in
  the source. Paying by card goes to the Latpeed product page
  (`https://www.latpeed.com/products/cRz3X`, 1 month ₩29,000 / 3 months ₩79,000); the
  URL lives in `PAY.cardUrl` in `app.js`. Until a URL is filled the button shows the
  "card link not connected yet" note and points at the account-transfer form.

## Issuing a Pro key (operator, ~10 seconds)

The signing key is **not** in this repository. It lives at
`<workspace>/projects/toksongjang-license/license_private_key.pem` (0600, outside the
public GitHub Pages checkout); `.gitignore` also blocks `*.pem` in case one is ever
copied in.

```
# once
python3 scripts/generate_license_key.py --init     # writes the key outside the repo
python3 scripts/generate_license_key.py --check    # public key in license.js matches

# per order (after the transfer is confirmed)
python3 scripts/generate_license_key.py --plan month   --email buyer@example.com
python3 scripts/generate_license_key.py --plan quarter --email buyer@example.com
python3 scripts/generate_license_key.py --verify "TS3.…"

# emergency: rotate the key pair
python3 scripts/generate_license_key.py --pub       # paste into license.js PUBLIC_KEY
```

Key format: `TS3.<base64url payload>.<base64url r||s>`, payload
`{"v":1,"id":"…","plan":"month|quarter|half","exp":"YYYY-MM-DD","iat":"YYYY-MM-DD","sub":"…"}`.
`exp` is the last valid day (Korea time). Each issued key is appended to
`issued_keys.csv` next to the private key. A key is not device-locked: it works in any
browser where it is pasted, so it can be shared — treat it as a 29,000원 honour-system
licence for the 14-day test.

## Limits (stated on the page)

- Postal codes are not looked up: the 행정안전부 road-name address API needs a free key
  and a server call, so the column stays blank unless the order already carries it
  (`우편번호: 06236`) or the user fills it in the table.
- Column names follow each courier's publicly listed acceptance fields; they are a
  standard shape, not a guarantee of the courier's current upload template.
- SmartStore export is the four-column waybill registration format
  (`상품주문번호, 배송방법, 택배사, 송장번호`), so order numbers must be filled in.
- Pro is sold as a licence key by email; a card checkout via Kmong is added once that
  listing is approved.

## Files

- `index.html` — page, SEO metadata, JSON-LD (SoftwareApplication, FAQPage)
- `styles.css` — all styling, CSS variables, no external fonts
- `parser.js` — dependency-free parser + CSV/TSV builders (browser global and CommonJS)
- `license.js` — ECDSA P-256 public-key licence check + the 5-order free limit
- `app.js` — table rendering, in-place editing, exports, paywall, order form, key entry
- `scripts/generate_license_key.py` — local key issuer (private key lives outside the repo)
- `tests/runner.html`, `tests/cases.js`, `tests/parser.test.js` — 244 assertions
- `tests/run-local.py` — same cases headless through QuickJS (`python3 tests/run-local.py`)
- `sitemap.xml`, `robots.txt`, `llms.txt`, `icons/favicon.svg`, `og-image.png`

## Running the tests

```
python3 -m http.server 8080      # 저장소 루트에서
open http://localhost:8080/kakao-invoice/tests/runner.html
```

The page prints `ALL PASS — 244/244` and exposes `window.__TEST_RESULTS`.
Headless: `python3 tests/run-local.py` (needs `pip install quickjs`).
