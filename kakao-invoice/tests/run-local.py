"""톡송장 3초 — 테스트 로컬 실행기

1) parser.js · license.js · analytics.js · share.js + tests/cases.js 를 QuickJS 로 그대로 돌립니다.
2) 화면 배선(GA4 태그·이벤트 호출·공유 버튼)을 index.html / app.js 원문에서 확인합니다.
    python3 tests/run-local.py
"""
import json
import pathlib
import re
import sys

import quickjs

ROOT = pathlib.Path(__file__).resolve().parent.parent

ctx = quickjs.Context()
ctx.eval("var window = this; var globalThis = this; var module = undefined;")

for name in ("parser.js", "license.js", "analytics.js", "share.js", "tests/cases.js"):
    source = (ROOT / name).read_text(encoding="utf-8")
    try:
        ctx.eval(source)
    except quickjs.JSException as exc:  # noqa: PERF203
        print(f"[로드 실패] {name}: {exc}")
        sys.exit(1)

harness = r"""
(function () {
  var out = [];
  function record(name, pass, detail) { out.push({ name: name, pass: !!pass, detail: detail || '' }); }
  var summary = window.__TonSongCases(window.TalkInvoice, record);
  return JSON.stringify({ summary: summary, results: out });
})()
"""

try:
    payload = json.loads(ctx.eval(harness))
except quickjs.JSException as exc:
    print(f"[실행 실패] {exc}")
    sys.exit(1)

results = payload["results"]

# ── 화면 배선 확인 (브라우저 없이 원문으로 검사) ─────────────────────
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
ANALYTICS = (ROOT / "analytics.js").read_text(encoding="utf-8")
ANALYTICS_CODE = re.sub(r"/\*.*?\*/", "", ANALYTICS, flags=re.S)
ANALYTICS_CODE = re.sub(r"//[^\n]*", "", ANALYTICS_CODE)

wiring = [
    (
        "배선: gtag.js 로드",
        "googletagmanager.com/gtag/js?id=G-37PP2BP7Z6" in HTML,
        "index.html 에 gtag.js 가 없습니다",
    ),
    (
        "배선: 측정 ID config",
        "gtag('config', 'G-37PP2BP7Z6'" in HTML,
        "gtag config 호출이 없습니다",
    ),
    (
        "배선: 광고 신호·개인화 신호 끔",
        "allow_google_signals: false" in HTML and "allow_ad_personalization_signals: false" in HTML,
        "광고 신호 옵션이 없습니다",
    ),
    (
        "배선: analytics.js·share.js 가 app.js 앞에 로드",
        HTML.find("analytics.js?") != -1
        and HTML.find("share.js?") != -1
        and HTML.find("analytics.js?") < HTML.find("app.js?")
        and HTML.find("share.js?") < HTML.find("app.js?"),
        "스크립트 순서를 확인하세요",
    ),
    (
        "배선: 공유 버튼 마크업",
        'id="shareRow"' in HTML and 'id="btnShare"' in HTML and 'id="shareStatus"' in HTML,
        "공유 버튼 마크업이 없습니다",
    ),
    (
        "배선: 공유 버튼 문구",
        "같은 공구·산지직송 사장님께 공유하기(링크 복사)" in HTML,
        "버튼 문구가 다릅니다",
    ),
    (
        "배선: convert_run 호출",
        "A.convertRun(" in APP,
        "변환 실행 이벤트가 연결되지 않았습니다",
    ),
    (
        "배선: paywall_hit 호출",
        "A.paywallHit(" in APP,
        "페이월 이벤트가 연결되지 않았습니다",
    ),
    (
        "배선: cta_click(latpeed)",
        "A.ctaClick('latpeed')" in APP,
        "래피드 카드결제 클릭 이벤트가 없습니다",
    ),
    (
        "배선: cta_click(bank_transfer)",
        "A.ctaClick('bank_transfer')" in APP,
        "계좌이체 클릭 이벤트가 없습니다",
    ),
    (
        "배선: 공유 버튼에 복사 함수 연결",
        "S.attach(btnShare, shareStatus, copyText)" in APP,
        "공유 버튼이 복사 로직에 연결되지 않았습니다",
    ),
    (
        "배선: 계측 모듈이 주문 필드를 다루지 않음",
        not any(
            word in ANALYTICS_CODE
            for word in ("수취인", "연락처", "주소", "phone", "address", "memo")
        ),
        "analytics.js 에 주문 필드 참조가 있습니다",
    ),
    (
        "배선: 개인정보 안내에 GA 문구",
        "Google Analytics" in HTML and "익명 이용 통계" in HTML,
        "화면 개인정보 안내에 계측 설명이 없습니다",
    ),
]

for name, ok, detail in wiring:
    results.append({"name": name, "pass": bool(ok), "detail": "" if ok else detail})

failed = [r for r in results if not r["pass"]]
for r in failed:
    print(f"FAIL  {r['name']}  —  {r['detail']}")

passed = len(results) - len(failed)
print(f"\n{passed}/{len(results)} 통과 · 실패 {len(failed)}건")
sys.exit(0 if not failed else 1)
