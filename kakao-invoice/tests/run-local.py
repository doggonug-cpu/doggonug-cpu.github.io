"""톡송장 3초 — 파서 단위 테스트 로컬 실행기 (QuickJS)

브라우저 없이 parser.js + tests/cases.js 를 그대로 돌려 실패 목록을 봅니다.
    python3 tests/run-local.py
"""
import json
import pathlib
import sys

import quickjs

ROOT = pathlib.Path(__file__).resolve().parent.parent

ctx = quickjs.Context()
ctx.eval("var window = this; var globalThis = this; var module = undefined;")

for name in ("parser.js", "tests/cases.js"):
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
failed = [r for r in results if not r["pass"]]
for r in failed:
    print(f"FAIL  {r['name']}  —  {r['detail']}")

passed = len(results) - len(failed)
print(f"\n{passed}/{len(results)} 통과 · 실패 {len(failed)}건")
sys.exit(0 if not failed else 1)
