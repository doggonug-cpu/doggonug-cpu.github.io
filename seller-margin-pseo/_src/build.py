#!/usr/bin/env python3
"""MarginCalc — 셀러·프리랜서 마진 계산기 pSEO 정적 사이트 생성기.

데이터(data/channels/*.json)에서 채널별 계산기 랜딩페이지, 허브, sitemap.xml,
robots.txt를 자동 생성합니다. 외부 의존성 없음(표준 라이브러리만 사용).

사용:
    python3 _src/build.py                     # 기본: 저장소 루트의 seller-margin-pseo/ 로 출력
    python3 _src/build.py --out dist          # 다른 폴더로 출력
    python3 _src/build.py --base-url https://example.com/x --check
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import re
import shutil
import sys
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

SRC = Path(__file__).resolve().parent
SITE = json.loads((SRC / "data" / "site.json").read_text(encoding="utf-8"))

VAT = 0.10
SEOUL = timezone(timedelta(hours=9))


# ---------------------------------------------------------------- formatting
def won(n) -> str:
    if n is None:
        return "—"
    return f"{int(round(n)):,}원"


def pct(n, digits: int = 1) -> str:
    if n is None:
        return "—"
    return f"{n:.{digits}f}%"


def esc(s: str) -> str:
    return html.escape(s, quote=True)


# ---------------------------------------------------------------- fee engine
class Channel:
    """채널 하나의 수수료 구조와 계산 로직."""

    def __init__(self, d: dict):
        self.raw = d
        self.slug: str = d["slug"]
        self.name: str = d["name"]
        self.group: str = d["group"]
        f = d["fees"]
        self.commission_pct = float(f.get("commission_pct") or 0.0)
        # 구간 누진 요율: [[상한(원 or None), 요율%], ...]
        self.commission_tiers = f.get("commission_tiers") or None
        self.commission_vat = bool(f.get("commission_vat", True))
        self.payment_pct = float(f.get("payment_pct") or 0.0)
        self.payment_vat = bool(f.get("payment_vat", True))
        self.payment_on_shipping = bool(f.get("payment_on_shipping", True))
        # 수수료 부과 기준: gross(결제액) | price(판매가) | shipping(배송비만)
        self.payment_base = f.get("payment_base") or ("gross" if self.payment_on_shipping else "price")
        self.fixed_per_order = float(f.get("fixed_per_order") or 0.0)
        self.monthly_fee = float(f.get("monthly_fee") or 0.0)
        self.withholding_pct = float(f.get("withholding_pct") or 0.0)
        self.vat_mode = d.get("vat_mode", "general")
        self.vat_simplified_pct = float(d.get("vat_simplified_pct") or 0.0)
        self.defaults = d["defaults"]

    # -- 수수료(부가세 제외 금액 기준) --------------------------------
    def commission_ex(self, price: float) -> float:
        if self.commission_tiers:
            total, prev = 0.0, 0.0
            for cap, rate in self.commission_tiers:
                upper = float("inf") if cap in (None, 0) else float(cap)
                if price <= prev:
                    break
                band = min(price, upper) - prev
                total += band * rate / 100.0
                prev = upper
                if price <= upper:
                    break
            return total
        return price * self.commission_pct / 100.0

    def commission(self, price: float) -> float:
        amt = self.commission_ex(price)
        return amt * (1 + VAT) if self.commission_vat else amt

    def payment(self, gross: float, price: float, ship_received: float = 0.0) -> float:
        base = {"gross": gross, "price": price, "shipping": ship_received}.get(
            self.payment_base, gross)
        amt = base * self.payment_pct / 100.0
        return amt * (1 + VAT) if self.payment_vat else amt

    def vat_amount(self, gross: float, cost: float) -> float:
        """납부 부가세 추정. 판매가가 부가세 포함가라는 전제."""
        if self.vat_mode == "general":
            return max(0.0, (gross - cost) / (1 + VAT) * VAT)
        if self.vat_mode == "simplified":
            return gross * self.vat_simplified_pct / 100.0
        return 0.0

    # -- 계산 ---------------------------------------------------------
    def compute(self, price: float, cost: float, ship_received: float = 0.0,
                ship_cost: float = 0.0, packaging: float = 0.0, ad_pct: float = 0.0,
                return_pct: float = 0.0, monthly_qty: float = 100) -> dict:
        gross = price + ship_received
        commission = self.commission(price)
        payment = self.payment(gross, price, ship_received)
        ad = gross * ad_pct / 100.0
        returns = gross * return_pct / 100.0
        vat = self.vat_amount(gross, cost)
        withholding = gross * self.withholding_pct / 100.0
        monthly = self.monthly_fee / max(monthly_qty, 1)
        fees = commission + payment
        cost_total = (cost + ship_cost + packaging + ad + returns + fees + vat
                      + withholding + self.fixed_per_order + monthly)
        net = gross - cost_total
        return {
            "gross": gross,
            "commission": commission,
            "payment": payment,
            "fees": fees,
            "ad": ad,
            "returns": returns,
            "vat": vat,
            "withholding": withholding,
            "monthly_alloc": monthly,
            "fixed": self.fixed_per_order,
            "cost": cost,
            "ship_cost": ship_cost,
            "packaging": packaging,
            "cost_total": cost_total,
            "net": net,
            "margin": (net / gross * 100.0) if gross else 0.0,
            "fee_rate": (fees / gross * 100.0) if gross else 0.0,
            "settlement": gross - fees - self.fixed_per_order - withholding - monthly,
            "platform_total": fees + self.fixed_per_order + monthly,
            "platform_rate": ((fees + self.fixed_per_order + monthly) / gross * 100.0) if gross else 0.0,
        }

    def compute_default(self) -> dict:
        d = self.defaults
        r = self.compute(
            price=d["price"], cost=d["cost"], ship_received=d.get("ship_received", 0),
            ship_cost=d.get("ship_cost", 0), packaging=d.get("packaging", 0),
            ad_pct=d.get("ad_pct", 0), return_pct=d.get("return_pct", 0),
            monthly_qty=d.get("monthly_qty", 100))
        r["monthly_net"] = r["net"] * d.get("monthly_qty", 100) - self.monthly_fee
        r["target_price"] = self.price_for_margin(d.get("target_margin", 20))
        r["breakeven"] = self.breakeven()
        return r

    # -- 역산: 손익분기 판매가 / 목표 마진 판매가 ----------------------
    def _net_at(self, price: float) -> float:
        d = self.defaults
        return self.compute(price, d["cost"], d.get("ship_received", 0),
                            d.get("ship_cost", 0), d.get("packaging", 0),
                            d.get("ad_pct", 0), d.get("return_pct", 0),
                            d.get("monthly_qty", 100))["net"]

    def breakeven(self, lo: float = 0.0, hi: float = 50_000_000.0):
        if self._net_at(lo) >= 0:
            return None  # 0원에서도 흑자 (역산 불필요)
        if self._net_at(hi) < 0:
            return None  # 어떤 가격에서도 흑자 불가
        for _ in range(80):
            mid = (lo + hi) / 2
            if self._net_at(mid) >= 0:
                hi = mid
            else:
                lo = mid
        return math.ceil(hi / 10) * 10

    def price_for_margin(self, target_pct: float, lo: float = 0.0,
                         hi: float = 200_000_000.0):
        d = self.defaults

        def g(p):
            r = self.compute(p, d["cost"], d.get("ship_received", 0),
                             d.get("ship_cost", 0), d.get("packaging", 0),
                             d.get("ad_pct", 0), d.get("return_pct", 0),
                             d.get("monthly_qty", 100))
            return r["net"] - r["gross"] * target_pct / 100.0

        if g(lo) >= 0:
            return None
        if g(hi) < 0:
            return None
        for _ in range(80):
            mid = (lo + hi) / 2
            if g(mid) >= 0:
                hi = mid
            else:
                lo = mid
        return math.ceil(hi / 10) * 10


# ---------------------------------------------------------------- data
def load_channels():
    channels = []
    for path in sorted((SRC / "data" / "channels").glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in data:
            channels.append(Channel(item))
    order = {g: i for i, g in enumerate(SITE["group_order"])}
    channels.sort(key=lambda c: (order.get(c.group, 99), c.raw.get("order", 99)))
    return channels


def channel_url(base: str, slug: str) -> str:
    return f"{base}/{slug}/"


# ---------------------------------------------------------------- fragments
def calc_widget(ch: Channel) -> str:
    d = ch.defaults
    cfg = {
        "commission_pct": ch.commission_pct,
        "commission_tiers": ch.commission_tiers,
        "commission_vat": ch.commission_vat,
        "payment_pct": ch.payment_pct,
        "payment_vat": ch.payment_vat,
        "payment_on_shipping": ch.payment_on_shipping,
        "payment_base": ch.payment_base,
        "fixed_per_order": ch.fixed_per_order,
        "monthly_fee": ch.monthly_fee,
        "withholding_pct": ch.withholding_pct,
        "vat_mode": ch.vat_mode,
        "vat_simplified_pct": ch.vat_simplified_pct,
        "labels": {
            "commission": ch.raw["fees"].get("commission_label", "채널 수수료"),
            "payment": ch.raw["fees"].get("payment_label", "결제 수수료"),
        },
    }
    cfg_json = json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")

    def num(id_, label, value, unit, step="100", hint="", cls=""):
        hint_html = f'<span class="hint">{esc(hint)}</span>' if hint else ""
        return f"""      <div class="field {cls}">
        <label for="{id_}">{esc(label)}{hint_html}</label>
        <div class="input-wrap">
          <input id="{id_}" name="{id_}" type="number" inputmode="numeric" step="{step}" min="0" value="{value}">
          <span class="unit">{esc(unit)}</span>
        </div>
      </div>"""

    inputs = "\n".join([
        num("in-price", "판매가 (고객 결제액)", d["price"], "원", "100", "부가세 포함"),
        num("in-cost", "매입 원가", d["cost"], "원", "100", "부가세 포함"),
        num("in-ship-received", "고객 부담 배송비", d.get("ship_received", 0), "원", "100", "무료배송이면 0"),
        num("in-ship-cost", "실제 배송비 지출", d.get("ship_cost", 0), "원", "100", "왕복 아님·편도 기준"),
        num("in-packaging", "포장·부자재", d.get("packaging", 0), "원", "100", "박스·완충재·라벨"),
        num("in-ad", "광고비 (매출 대비)", d.get("ad_pct", 0), "%", "0.5", "키워드·노출 광고"),
        num("in-return", "반품·교환 충당 (매출 대비)", d.get("return_pct", 0), "%", "0.5", "왕복 배송·재포장 손실"),
        num("in-qty", "월 판매 건수", d.get("monthly_qty", 100), "건", "1", "월 고정비 배분용"),
        num("in-target", "목표 마진율", d.get("target_margin", 20), "%", "1", "이 마진을 내려면 얼마에 팔아야 할까"),
    ])

    return f"""<section class="calc" id="calculator" aria-labelledby="calc-title">
  <div class="calc-head">
    <h2 id="calc-title">{esc(ch.name)} 계산기</h2>
    <p>숫자를 바꾸면 아래 결과가 바로 다시 계산됩니다. 요율은 <strong>{esc(ch.raw["fee_basis"])}</strong> 기준으로 미리 넣어 두었습니다.</p>
  </div>
  <div class="calc-grid">
    <form class="calc-inputs" id="calc-form" autocomplete="off">
{inputs}
    </form>
    <div class="calc-results" aria-live="polite">
      <div class="result-main">
        <span class="result-label">건당 순수익</span>
        <strong class="result-value" id="out-net">—</strong>
        <span class="result-sub" id="out-margin">—</span>
      </div>
      <dl class="result-list">
        <div><dt>고객 결제액</dt><dd id="out-gross">—</dd></div>
        <div><dt id="out-comm-label">채널 수수료</dt><dd id="out-commission">—</dd></div>
        <div><dt id="out-pay-label">결제 수수료</dt><dd id="out-payment">—</dd></div>
        <div><dt>부가세·원천징수</dt><dd id="out-tax">—</dd></div>
        <div><dt>광고·반품 충당</dt><dd id="out-var">—</dd></div>
        <div><dt>원가·배송·포장</dt><dd id="out-base">—</dd></div>
        <div class="emphasis"><dt>정산 예정금</dt><dd id="out-settlement">—</dd></div>
        <div class="emphasis"><dt>월 순수익 (입력 건수)</dt><dd id="out-monthly">—</dd></div>
        <div><dt>손익분기 판매가</dt><dd id="out-breakeven">—</dd></div>
        <div><dt id="out-target-label">목표 마진 {d.get("target_margin", 20)}% 판매가</dt><dd id="out-target">—</dd></div>
      </dl>
      <p class="result-note" id="out-note"></p>
    </div>
  </div>
  <script type="application/json" id="calc-config">{cfg_json}</script>
</section>"""


def fee_table(ch: Channel) -> str:
    rows = "\n".join(
        f"""        <tr><th scope="row">{esc(r["item"])}</th><td>{esc(r["rate"])}</td><td>{esc(r["base"])}</td><td>{esc(r["note"])}</td></tr>"""
        for r in ch.raw["fee_rows"])
    return f"""<div class="table-scroll">
      <table class="data-table">
        <caption>{esc(ch.name)} 수수료 구조</caption>
        <thead><tr><th scope="col">항목</th><th scope="col">요율</th><th scope="col">부과 기준</th><th scope="col">비고</th></tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
    <p class="source-note">요율 기준: {esc(ch.raw["fee_basis"])} · 정산 주기: {esc(ch.raw["settlement"])}</p>"""


def sim_table(ch: Channel) -> str:
    d = ch.defaults
    base = d["price"]
    prices = sorted({max(int(round(base * k / 1000.0)) * 1000, 1000) for k in (0.7, 1.0, 1.4)})
    rows = []
    for p in prices:
        cost = int(round(p * 0.4 / 100.0)) * 100
        r = ch.compute(p, cost, d.get("ship_received", 0), d.get("ship_cost", 0),
                       d.get("packaging", 0), d.get("ad_pct", 0), d.get("return_pct", 0),
                       d.get("monthly_qty", 100))
        rows.append((p, cost, r))
    body = "\n".join(
        f"""        <tr><td>{won(p)}</td><td>{won(c)}</td><td>{won(r["fees"])}</td><td>{won(r["vat"] + r["withholding"])}</td><td class="{'neg' if r['net'] < 0 else 'pos'}">{won(r["net"])}</td><td>{pct(r["margin"])}</td></tr>"""
        for p, c, r in rows)

    cost_rows = []
    for ratio in (30, 40, 50):
        cost = int(round(base * ratio / 100.0 / 100.0)) * 100
        r = ch.compute(base, cost, d.get("ship_received", 0), d.get("ship_cost", 0),
                       d.get("packaging", 0), d.get("ad_pct", 0), d.get("return_pct", 0),
                       d.get("monthly_qty", 100))
        cost_rows.append((ratio, cost, r))
    body2 = "\n".join(
        f"""        <tr><td>{ratio}%</td><td>{won(c)}</td><td class="{'neg' if r['net'] < 0 else 'pos'}">{won(r["net"])}</td><td>{pct(r["margin"])}</td></tr>"""
        for ratio, c, r in cost_rows)

    return f"""<div class="table-pair">
      <div class="table-scroll">
        <table class="data-table">
          <caption>판매가별 시뮬레이션 (원가 = 판매가의 40% 가정)</caption>
          <thead><tr><th scope="col">판매가</th><th scope="col">원가</th><th scope="col">수수료</th><th scope="col">세금</th><th scope="col">순수익</th><th scope="col">마진율</th></tr></thead>
          <tbody>
{body}
          </tbody>
        </table>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <caption>원가율별 (판매가 {won(base)} 고정)</caption>
          <thead><tr><th scope="col">원가율</th><th scope="col">원가</th><th scope="col">순수익</th><th scope="col">마진율</th></tr></thead>
          <tbody>
{body2}
          </tbody>
        </table>
      </div>
    </div>"""


def bullets(items, cls="") -> str:
    lis = "\n".join(f"        <li>{esc(i)}</li>" for i in items)
    return f'      <ul class="bullet-list {cls}">\n{lis}\n      </ul>'


def faq_block(ch: Channel) -> str:
    out = []
    for i, item in enumerate(ch.raw["faq"]):
        out.append(f"""      <details class="faq-item"{' open' if i == 0 else ''}>
        <summary><h3>{esc(item["q"])}</h3></summary>
        <div class="faq-body"><p>{esc(item["a"])}</p></div>
      </details>""")
    return "\n".join(out)


def related_cards(ch: Channel, channels, base: str) -> str:
    by_slug = {c.slug: c for c in channels}
    picks = [by_slug[s] for s in ch.raw["related"] if s in by_slug][:3]
    cards = []
    for c in picks:
        r = c.compute_default()
        cards.append(f"""      <a class="mini-card" href="../{c.slug}/">
        <span class="mini-kicker">{esc(SITE["groups"][c.group])}</span>
        <strong>{esc(c.name)}</strong>
        <span>{won(c.defaults["price"])} 판매 시 순수익 {won(r["net"])}</span>
        <span class="mini-metrics">수수료·고정비 {pct(r["platform_rate"])} · 마진 {pct(r["margin"])}</span>
      </a>""")
    return "\n".join(cards)


def comparison_row(ch: Channel, price, cost, overrides=None) -> str:
    d = ch.defaults
    kw = dict(ship_received=d.get("ship_received", 0), ship_cost=d.get("ship_cost", 0),
              packaging=d.get("packaging", 0), ad_pct=d.get("ad_pct", 0),
              return_pct=d.get("return_pct", 0), monthly_qty=d.get("monthly_qty", 100))
    if overrides:
        kw.update(overrides)
    r = ch.compute(price, cost, **kw)
    cls = "neg" if r["net"] < 0 else "pos"
    return f"""        <tr>
          <th scope="row"><a href="./{ch.slug}/">{esc(ch.name)}</a></th>
          <td data-label="판매가">{won(price)}</td>
          <td data-label="총 수수료">{won(r["platform_total"])}</td>
          <td data-label="수수료율">{pct(r["platform_rate"])}</td>
          <td data-label="세금">{won(r["vat"] + r["withholding"])}</td>
          <td data-label="순수익" class="{cls}">{won(r["net"])}</td>
          <td data-label="마진율" class="{cls}">{pct(r["margin"])}</td>
        </tr>"""


# ---------------------------------------------------------------- layout
def asset_version(name: str) -> str:
    path = SRC / "assets" / name
    if not path.exists():
        return "0"
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def layout(page: dict) -> str:
    tpl = (SRC / "templates" / "layout.html").read_text(encoding="utf-8")
    base = page["base"]
    cssv, jsv, ogv = asset_version("style.css"), asset_version("calc.js"), asset_version("og.png")
    nav_items = [
        (f"{base}/", "전체 계산기", page["slug"] == ""),
        (f"{base}/about/", "계산 방법과 출처", page["slug"] == "about"),
    ]
    nav_lines = []
    for u, t, active in nav_items:
        mark = ' aria-current="page"' if active else ""
        nav_lines.append(f'        <a href="{u}"{mark}>{esc(t)}</a>')
    nav = "\n".join(nav_lines)
    body = page["body"]
    body = body.replace("__BASE__", base)
    out = (tpl.replace("__LANG__", "ko")
              .replace("__TITLE__", esc(page["title"]))
              .replace("__DESC__", esc(page["desc"]))
              .replace("__CANONICAL__", page["canonical"])
              .replace("__BASE__", base)
              .replace("__NAV__", nav)
              .replace("__BODY__", body)
              .replace("__JSONLD__", page["jsonld"])
              .replace("__UPDATED__", SITE["updated_ko"])
              .replace("__SITE__", esc(SITE["name"]))
              .replace("__TAGLINE__", esc(SITE["tagline"]))
              .replace("__CSSV__", cssv)
              .replace("__JSV__", jsv)
              .replace("__OGV__", ogv))
    return out


def jsonld(data) -> str:
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    return f'<script type="application/ld+json">{payload}</script>'


# ---------------------------------------------------------------- pages
def build_hub(channels, base) -> dict:
    shop = [c for c in channels if c.group == "shop"]
    food = [c for c in channels if c.group == "food"]
    service = [c for c in channels if c.group == "service"]

    # 상품 채널은 동일 조건(3만원/원가 40%), 배달 채널은 외식 조건으로 비교
    price, cost = 30000, 12000
    shop_rows = "\n".join(
        comparison_row(c, price, cost,
                       {"ship_received": 0, "ad_pct": 3, "return_pct": 2,
                        "monthly_qty": 100})
        for c in shop)
    food_price, food_cost = 25000, 8000
    food_rows = "\n".join(
        comparison_row(c, food_price, food_cost,
                       {"ship_received": 0, "packaging": 500,
                        "ad_pct": 0, "return_pct": 1, "monthly_qty": 300})
        for c in food)
    service_rows = "\n".join(
        comparison_row(c, c.defaults["price"], c.defaults["cost"])
        for c in service)

    cards = []
    for group, items in (("shop", shop), ("food", food), ("service", service)):
        links = "\n".join(
            f"""          <li><a href="./{c.slug}/"><strong>{esc(c.name)}</strong><span>{esc(c.raw["one_liner"])}</span></a></li>"""
            for c in items)
        cards.append(f"""      <section class="group-block" aria-labelledby="g-{group}">
        <h2 id="g-{group}">{esc(SITE["groups"][group])}</h2>
        <ul class="channel-list">
{links}
        </ul>
      </section>""")

    faq = "\n".join(
        f"""      <details class="faq-item"{' open' if i == 0 else ''}>
        <summary><h3>{esc(q)}</h3></summary>
        <div class="faq-body"><p>{esc(a)}</p></div>
      </details>""" for i, (q, a) in enumerate(SITE["hub_faq"]))

    body = f"""<main id="main">
  <section class="hero">
    <p class="eyebrow">셀러·프리랜서 마진 계산기</p>
    <h1>판매 채널 {len(channels)}곳의 수수료와 순수익을 같은 조건에서 비교합니다</h1>
    <p class="lede">스마트스토어, 쿠팡, 배달앱, 패션 플랫폼, 크몽·숨고 같은 서비스 마켓, 자사몰까지 — 채널마다 수수료 항목과 부과 기준이 달라 정산금이 매출의 80% 아래로 떨어지는 일이 흔합니다. 채널을 고르고 숫자를 넣으면 수수료·부가세·광고비·반품 충당을 모두 뺀 건당 순수익과 마진율, 손익분기 판매가까지 바로 나옵니다.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="#compare">채널별 순수익 비교표 보기</a>
      <a class="btn" href="{base}/about/">계산 방법과 출처</a>
    </div>
  </section>

  <section class="compare" id="compare" aria-labelledby="compare-title">
    <h2 id="compare-title">상품 판매 채널 비교</h2>
    <p class="section-note">아래 표는 판매가 {won(price)}, 원가 {won(cost)}, 광고비 매출의 3%, 반품 충당 2%를 모든 채널에 같게 넣은 결과입니다. 배송비·포장비와 월 고정비는 채널 구조가 달라 각 채널 기본값을 그대로 썼습니다(예: 쿠팡 로켓그로스는 쿠팡이 발송해 배송비 0원, 대신 물류비 2,200원). 실제 요율은 카테고리·계약에 따라 다르므로 각 채널 페이지에서 직접 조정하세요.</p>
    <div class="table-scroll">
      <table class="data-table compare-table">
        <caption>상품 채널 순수익 비교 (동일 조건)</caption>
        <thead><tr><th scope="col">채널</th><th scope="col">판매가</th><th scope="col">총 수수료</th><th scope="col">수수료율</th><th scope="col">세금</th><th scope="col">순수익</th><th scope="col">마진율</th></tr></thead>
        <tbody>
{shop_rows}
        </tbody>
      </table>
    </div>
  </section>

  <section class="compare" aria-labelledby="compare-food-title">
    <h2 id="compare-food-title">배달·외식 채널 비교</h2>
    <p class="section-note">배달은 상품 판매와 비용 구조가 달라 외식 기준으로 계산했습니다 — 주문 금액 {won(food_price)}, 재료 원가 {won(food_cost)}(32%), 포장 500원, 광고비 0%, 반품 충당 1%. 배달비는 채널별 업주 부담액을 그대로 넣었습니다(배민·쿠팡이츠·요기요 2,900원, 땡겨요 2,500원, 포장 0원). 배달비를 빼고 수수료율만 보면 실제 마진을 알 수 없습니다.</p>
    <div class="table-scroll">
      <table class="data-table compare-table">
        <caption>배달 채널 순수익 비교 (외식 기준)</caption>
        <thead><tr><th scope="col">채널</th><th scope="col">주문금액</th><th scope="col">총 수수료</th><th scope="col">수수료율</th><th scope="col">세금</th><th scope="col">순수익</th><th scope="col">마진율</th></tr></thead>
        <tbody>
{food_rows}
        </tbody>
      </table>
    </div>
  </section>

  <section class="compare" aria-labelledby="compare2-title">
    <h2 id="compare2-title">서비스·프리랜서·자사몰 비교</h2>
    <p class="section-note">서비스 마켓과 자사몰은 상품 마켓과 금액대가 달라 각 채널의 기본 조건으로 계산했습니다. 판매가 열을 함께 보세요. 크몽처럼 판매 금액 구간마다 요율이 내려가는 구조는 구간 누진으로 계산합니다.</p>
    <div class="table-scroll">
      <table class="data-table compare-table">
        <caption>서비스·자사몰 순수익 비교</caption>
        <thead><tr><th scope="col">채널</th><th scope="col">판매가</th><th scope="col">총 수수료</th><th scope="col">수수료율</th><th scope="col">세금</th><th scope="col">순수익</th><th scope="col">마진율</th></tr></thead>
        <tbody>
{service_rows}
        </tbody>
      </table>
    </div>
  </section>

  <section class="groups" aria-labelledby="groups-title">
    <h2 id="groups-title">채널별 계산기</h2>
    <p class="section-note">채널 이름을 누르면 그 채널 전용 계산기로 이동합니다.</p>
{chr(10).join(cards)}
  </section>

  <section class="how" aria-labelledby="how-title">
    <h2 id="how-title">계산에 넣는 항목</h2>
    <ol class="how-list">
      <li><strong>채널 수수료</strong> — 판매가에 붙는 플랫폼 몫. 요율이 부가세 별도로 공시된 곳은 부가세 10%를 더했습니다.</li>
      <li><strong>결제 수수료</strong> — PG·네이버페이·Z결제 등 결제 처리 몫. 쿠팡처럼 카테고리 수수료에 포함된 곳은 0원입니다.</li>
      <li><strong>부가세·원천징수</strong> — 일반과세자는 (매출−매입)의 10%, 간이과세자는 업종 부가율, 프리랜서는 3.3% 원천징수로 계산합니다.</li>
      <li><strong>광고비와 반품 충당</strong> — 매출 대비 비율로 넣습니다. 정산서에서 정확히 빠지는 금액이지만 수수료표에는 없는 항목입니다.</li>
      <li><strong>원가·배송·포장</strong> — 여기까지 빼야 남는 돈이 실제 통장에 들어옵니다.</li>
    </ol>
    <p><a href="{base}/about/">계산식 전체와 데이터 출처 보기 →</a></p>
  </section>

  <section class="faq" aria-labelledby="faq-title">
    <h2 id="faq-title">자주 묻는 질문</h2>
{faq}
  </section>
</main>"""

    jsonld_data = [
        {"@context": "https://schema.org", "@type": "WebSite",
         "name": SITE["name"], "url": f"{base}/", "inLanguage": "ko",
         "description": SITE["desc"]},
        {"@context": "https://schema.org", "@type": "ItemList",
         "name": "판매 채널별 마진 계산기",
         "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "name": c.name,
              "url": channel_url(base, c.slug)} for i, c in enumerate(channels)]},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q,
                         "acceptedAnswer": {"@type": "Answer", "text": a}}
                        for q, a in SITE["hub_faq"]]},
    ]
    return {
        "slug": "", "base": base, "canonical": f"{base}/",
        "title": f"셀러 마진 계산기 — 판매 채널 {len(channels)}곳 수수료·순수익 비교 | {SITE['name']}",
        "desc": SITE["desc"],
        "body": body,
        "jsonld": "\n".join(jsonld(d) for d in jsonld_data),
    }


def build_channel(ch: Channel, channels, base) -> dict:
    r = ch.compute_default()
    d = ch.defaults
    target = d.get("target_margin", 20)
    be_txt = won(r["breakeven"]) if r["breakeven"] else "0원에서도 흑자"
    tp_txt = won(r["target_price"]) if r["target_price"] else "이 원가 구조로는 달성 어려움"

    body = f"""<main id="main">
  <nav class="breadcrumb" aria-label="위치"><a href="{base}/">전체 계산기</a> <span aria-hidden="true">›</span> <span>{esc(ch.name)}</span></nav>
  <header class="page-head">
    <p class="eyebrow">{esc(SITE["groups"][ch.group])} · {esc(ch.raw["operator"])}</p>
    <h1>{esc(ch.raw["h1"])}</h1>
    <p class="lede">{esc(ch.raw["lede"])}</p>
    <ul class="badges">
{chr(10).join(f'      <li>{esc(b)}</li>' for b in ch.raw["badges"])}
    </ul>
  </header>

{calc_widget(ch)}

  <section class="summary" aria-labelledby="summary-title">
    <h2 id="summary-title">기본 조건 요약</h2>
    <div class="stat-grid">
      <div class="stat"><span class="stat-label">판매가</span><strong>{won(d["price"])}</strong><span class="stat-sub">원가 {won(d["cost"])} · 광고 {pct(d.get("ad_pct", 0))}</span></div>
      <div class="stat"><span class="stat-label">정산 예정금</span><strong>{won(r["settlement"])}</strong><span class="stat-sub">수수료·고정비 {won(r["platform_total"])} 차감</span></div>
      <div class="stat"><span class="stat-label">건당 순수익</span><strong class="{'neg' if r['net'] < 0 else 'pos'}">{won(r["net"])}</strong><span class="stat-sub">마진율 {pct(r["margin"])}</span></div>
      <div class="stat"><span class="stat-label">손익분기 판매가</span><strong>{be_txt}</strong><span class="stat-sub">목표 {target}% 판매가 {tp_txt}</span></div>
    </div>
    <p class="section-note">기본 조건에서 이 채널의 수수료·고정비는 결제액의 <strong>{pct(r["platform_rate"])}</strong>, 부가세·원천징수는 <strong>{won(r["vat"] + r["withholding"])}</strong>입니다. 정산 예정금은 수수료·고정비를 뺀 금액이고, 여기서 원가·배송비·광고비·세금을 빼야 실제 남는 돈이 됩니다.</p>
  </section>

  <section class="fees" aria-labelledby="fees-title">
    <h2 id="fees-title">{esc(ch.name)} 수수료 구조</h2>
{fee_table(ch)}
    <div class="prose">
      {''.join(f'<p>{esc(p)}</p>' for p in ch.raw["structure_notes"])}
    </div>
  </section>

  <section class="sim" aria-labelledby="sim-title">
    <h2 id="sim-title">숫자로 보는 {esc(ch.name)} 마진</h2>
{sim_table(ch)}
    <p class="section-note">수수료는 판매가가 아니라 <strong>고객이 실제 결제한 금액</strong> 기준으로 계산됩니다. 쿠폰·즉시할인을 적용한 만큼 수수료도 줄지만, 원가와 배송비는 줄지 않습니다.</p>
  </section>

  <section class="pitfalls" aria-labelledby="pit-title">
    <h2 id="pit-title">정산서에서 자주 놓치는 것</h2>
{builders_pitfalls(ch)}
  </section>

  <section class="fit" aria-labelledby="fit-title">
    <h2 id="fit-title">이 채널이 맞는 경우</h2>
    <div class="fit-grid">
      <div class="fit-col fit-yes">
        <h3>맞습니다</h3>
{bullets(ch.raw["fit_yes"])}
      </div>
      <div class="fit-col fit-no">
        <h3>다른 채널이 낫습니다</h3>
{bullets(ch.raw["fit_no"])}
      </div>
    </div>
  </section>

  <!-- AFFILIATE_SLOT:start — 아래 aside는 제휴·광고 자리를 미리 잡아 둔 빈 구조입니다.
       실제 링크나 광고 코드는 넣지 않았습니다. 도입 시 data/site.json의 affiliate 설정을 채우고
       이 블록을 렌더링하면 됩니다. -->
  <aside class="promo-slot" data-slot="affiliate" aria-label="추천 도구 자리" hidden></aside>
  <!-- AFFILIATE_SLOT:end -->

  <section class="faq" aria-labelledby="faq-title">
    <h2 id="faq-title">{esc(ch.name)} 자주 묻는 질문</h2>
{faq_block(ch)}
  </section>

  <section class="related" aria-labelledby="rel-title">
    <h2 id="rel-title">다른 채널 계산기</h2>
    <div class="mini-grid">
{related_cards(ch, channels, base)}
    </div>
  </section>

  <section class="sources" aria-labelledby="src-title">
    <h2 id="src-title">요율 출처</h2>
    <ul class="source-list">
{chr(10).join(f'      <li>{esc(s["label"])} — <a href="{s["url"]}" rel="nofollow noopener" target="_blank">{esc(s["url"])}</a></li>' for s in ch.raw["sources"])}
    </ul>
    <p class="source-note">{esc(ch.raw["fee_basis"])} 기준입니다. 요율과 정산 조건은 계약·카테고리·프로모션에 따라 달라질 수 있어, 실제 정산금은 판매자센터의 정산 내역으로 확인하셔야 합니다. 이 페이지의 계산 결과는 참고용 추정치입니다.</p>
  </section>
</main>"""

    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage",
              "mainEntity": [{"@type": "Question", "name": q["q"],
                              "acceptedAnswer": {"@type": "Answer", "text": q["a"]}}
                             for q in ch.raw["faq"]]}
    app_ld = {"@context": "https://schema.org", "@type": "WebApplication",
              "name": f"{ch.name} 마진 계산기", "url": channel_url(base, ch.slug),
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Any", "inLanguage": "ko",
              "offers": {"@type": "Offer", "price": "0", "priceCurrency": "KRW"},
              "description": ch.raw["lede"]}
    crumb_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "전체 계산기", "item": f"{base}/"},
                    {"@type": "ListItem", "position": 2, "name": ch.name,
                     "item": channel_url(base, ch.slug)}]}
    return {
        "slug": ch.slug, "base": base, "canonical": channel_url(base, ch.slug),
        "title": ch.raw["title"], "desc": ch.raw["desc"],
        "body": body,
        "jsonld": "\n".join(jsonld(x) for x in (app_ld, faq_ld, crumb_ld)),
    }


def builders_pitfalls(ch: Channel) -> str:
    return bullets(ch.raw["pitfalls"], cls="pitfall-list")


def build_about(channels, base) -> dict:
    rows = "\n".join(
        f"""        <tr><th scope="row">{esc(c.name)}</th><td>{esc(c.raw["fee_basis"])}</td><td>{esc(c.raw["settlement"])}</td></tr>"""
        for c in channels)
    body = f"""<main id="main">
  <nav class="breadcrumb" aria-label="위치"><a href="{base}/">전체 계산기</a> <span aria-hidden="true">›</span> <span>계산 방법과 출처</span></nav>
  <header class="page-head">
    <p class="eyebrow">방법론</p>
    <h1>계산 방법과 데이터 출처</h1>
    <p class="lede">이 사이트는 채널별 수수료 구조를 데이터 파일로 관리하고, 그 데이터에서 계산기 페이지와 비교표를 자동으로 생성합니다. 계산식과 요율 기준을 공개합니다.</p>
  </header>

  <section class="prose" aria-labelledby="formula-title">
    <h2 id="formula-title">계산식</h2>
    <p>건당 순수익은 다음과 같이 계산합니다.</p>
    <pre class="formula">순수익 = 고객결제액(판매가 + 고객부담 배송비)
        − 채널 수수료        (판매가 × 요율, 부가세 별도 공시 요율은 ×1.1)
        − 결제 수수료        (결제액 또는 판매가 × 요율)
        − 부가세·원천징수
        − 광고비             (결제액 × 입력 비율)
        − 반품·교환 충당      (결제액 × 입력 비율)
        − 매입 원가 − 실제 배송비 − 포장·부자재
        − 건당 고정비 − (월 고정비 ÷ 월 판매 건수)</pre>
    <ul class="bullet-list">
      <li><strong>부가세(일반과세자)</strong>: 판매가가 부가세 포함가라는 전제로 (결제액 − 매입원가) ÷ 11. 수수료에 포함된 부가세의 매입세액 공제는 반영하지 않아 실제 납부액은 이보다 조금 적을 수 있습니다.</li>
      <li><strong>부가세(간이과세자)</strong>: 결제액 × 업종 부가율 × 10%. 소매업 부가율 15%를 적용하면 매출의 1.5%입니다.</li>
      <li><strong>프리랜서 3.3%</strong>: 개인에게 용역 대금을 지급할 때 떼는 소득세 3% + 지방소득세 0.3%입니다. 종합소득세 신고에서 경비율에 따라 일부 돌려받을 수 있지만, 이 계산기는 지급 시점의 현금 흐름만 봅니다.</li>
      <li><strong>구간 누진(크몽)</strong>: 판매 금액을 구간으로 나눠 구간별 요율을 각각 적용한 뒤 합산합니다.</li>
      <li><strong>손익분기 판매가</strong>: 다른 조건을 고정하고 순수익이 0이 되는 판매가를 이분법으로 찾습니다.</li>
    </ul>
  </section>

  <section class="prose" aria-labelledby="source-title">
    <h2 id="source-title">요율 기준</h2>
    <p>요율은 각 플랫폼이 공개한 판매자 안내·약관·요금표를 기준으로 정리했습니다. 공시 요율이 부가세 별도인 경우 계산에서 10%를 더합니다. 공개하지 않는 플랫폼(무신사 등)은 공개된 조사·보도 값을 쓰고 그 사실을 페이지에 적었습니다.</p>
    <div class="table-scroll">
      <table class="data-table">
        <caption>채널별 요율 기준과 정산 주기</caption>
        <thead><tr><th scope="col">채널</th><th scope="col">요율 기준</th><th scope="col">정산 주기</th></tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
    <p class="source-note">마지막 데이터 갱신: {SITE["updated_ko"]}. 요율은 예고 없이 바뀝니다. 계약 전에는 판매자센터의 내 계정 기준 요율표를 확인하세요.</p>
  </section>

  <section class="prose" aria-labelledby="update-title">
    <h2 id="update-title">갱신 방식</h2>
    <p>이 사이트는 정적 HTML로 미리 생성되어 서버 없이 동작합니다. 매주 월요일 오전에 GitHub Actions가 데이터에서 페이지를 다시 만들고, 데이터가 바뀐 경우에만 배포합니다. 계산은 방문자의 브라우저에서 이뤄지며 입력한 값을 어디로도 보내지 않습니다.</p>
  </section>

  <section class="prose" aria-labelledby="disclaimer-title">
    <h2 id="disclaimer-title">한계와 면책</h2>
    <ul class="bullet-list">
      <li>카테고리·계약·프로모션에 따라 실제 요율은 공시 요율과 다릅니다. 이 계산기는 의사결정 전 비교용 추정치입니다.</li>
      <li>세금 계산은 단순화한 모델입니다. 개인 사업자의 종합소득세, 인적용역 원천징수 환급, 간이과세 부가율 차이는 반영하지 않습니다.</li>
      <li>반품·교환 충당과 광고비는 매출 대비 비율로 입력하는 값이라 실제 발생액과 차이가 날 수 있습니다.</li>
      <li>이 사이트는 세무·법률 자문을 제공하지 않습니다. 신고 금액은 홈택스와 세무 전문가 확인을 거치세요.</li>
    </ul>
  </section>

  <section class="prose" aria-labelledby="privacy-title">
    <h2 id="privacy-title">개인정보와 광고</h2>
    <p>현재 이 사이트에는 광고·제휴 링크·추적 스크립트가 없고, 쿠키도 쓰지 않습니다. 계산기에 입력한 값은 브라우저 안에서만 처리됩니다. 나중에 제휴 프로그램이나 광고를 도입하면 그 사실과 쿠키 사용 여부를 이 페이지에 먼저 적겠습니다.</p>
  </section>

  <section class="prose" aria-labelledby="contact-title">
    <h2 id="contact-title">문의·오류 신고</h2>
    <p>요율이 바뀌었거나 계산 결과가 이상하면 <a href="https://github.com/doggonug-cpu/doggonug-cpu.github.io/issues" rel="noopener" target="_blank">저장소 이슈</a>로 알려 주세요. 확인 후 데이터를 고칩니다.</p>
  </section>
</main>"""
    return {
        "slug": "about", "base": base, "canonical": f"{base}/about/",
        "title": f"계산 방법과 데이터 출처 | {SITE['name']}",
        "desc": "마진 계산기의 계산식, 부가세·원천징수 처리 방식, 채널별 요율 기준과 정산 주기, 갱신 방식과 한계를 공개합니다.",
        "body": body,
        "jsonld": jsonld({"@context": "https://schema.org", "@type": "AboutPage",
                          "name": "계산 방법과 데이터 출처", "url": f"{base}/about/",
                          "inLanguage": "ko"}),
    }


def build_404(base) -> str:
    return f"""<main id="main" class="notfound">
  <h1>페이지를 찾을 수 없습니다</h1>
  <p>주소가 바뀌었거나 없는 페이지입니다. 채널별 계산기는 <a href="{base}/">전체 계산기</a>에서 고르실 수 있습니다.</p>
</main>"""


# ---------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(SRC.parent))
    ap.add_argument("--base-url", default=SITE["base_url"])
    ap.add_argument("--check", action="store_true", help="생성 후 검증만 수행")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")
    out = Path(args.out).resolve()
    channels = load_channels()

    pages = [build_hub(channels, base)] + [build_channel(c, channels, base) for c in channels]
    about = build_about(channels, base)

    created = []
    for page in pages + [about]:
        rel = Path(page["slug"]) / "index.html" if page["slug"] else Path("index.html")
        path = out / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(layout(page), encoding="utf-8")
        created.append(path)

    (out / "404.html").parent.mkdir(parents=True, exist_ok=True)
    (out / "404.html").write_text(
        layout({"slug": "404", "base": base, "canonical": f"{base}/404.html",
                "title": f"페이지를 찾을 수 없습니다 | {SITE['name']}",
                "desc": "없는 페이지입니다.", "body": build_404(base),
                "jsonld": ""}), encoding="utf-8")

    # sitemap
    urls = [(f"{base}/", "1.0"), (f"{base}/about/", "0.6")] + \
           [(channel_url(base, c.slug), "0.8") for c in channels]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, prio in urls:
        sm.append(f"  <url><loc>{loc}</loc><lastmod>{SITE['updated']}</lastmod>"
                  f"<changefreq>weekly</changefreq><priority>{prio}</priority></url>")
    sm.append("</urlset>")
    (out / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")

    robots = f"""# {SITE['name']}
# 이 robots.txt는 하위 경로(/seller-margin-pseo/)에 있습니다.
# 크롤러가 실제로 읽는 파일은 도메인 루트의 /robots.txt 입니다.
User-agent: *
Allow: /seller-margin-pseo/
Disallow: /seller-margin-pseo/_src/

Sitemap: {base}/sitemap.xml
"""
    (out / "robots.txt").write_text(robots, encoding="utf-8")

    # assets
    src_assets = SRC / "assets"
    dst_assets = out / "assets"
    dst_assets.mkdir(parents=True, exist_ok=True)
    for f in src_assets.iterdir():
        if f.is_file():
            shutil.copy2(f, dst_assets / f.name)

    if not args.quiet:
        print(f"생성 완료: {out}")
        print(f"  페이지 {len(pages) + 1}개 + 404, sitemap {len(urls)}개 URL")

    if args.check:
        return run_checks(out, channels, base)
    return 0


def run_checks(out: Path, channels, base) -> int:
    errors = []
    htmls = sorted(out.glob("*/index.html")) + [out / "index.html"]
    if len(htmls) != len(channels) + 2:
        errors.append(f"페이지 수 불일치: {len(htmls)}")
    for c in channels:
        raw = c.raw
        for key in ("title", "desc", "h1", "lede", "fee_basis", "settlement",
                    "sources", "fee_rows", "structure_notes", "pitfalls",
                    "fit_yes", "fit_no", "faq", "related", "one_liner"):
            if not raw.get(key):
                errors.append(f"{c.slug}: {key} 없음")
        if len(raw["faq"]) < 4:
            errors.append(f"{c.slug}: FAQ {len(raw['faq'])}개 (최소 4)")
        if len(raw["pitfalls"]) < 3:
            errors.append(f"{c.slug}: 함정 {len(raw['pitfalls'])}개 (최소 3)")
        if len(raw["title"]) > 70:
            errors.append(f"{c.slug}: title {len(raw['title'])}자 (70 초과)")
        if not (60 <= len(raw["desc"]) <= 165):
            errors.append(f"{c.slug}: desc {len(raw['desc'])}자 (60~165 권장)")
        page = (out / c.slug / "index.html").read_text(encoding="utf-8")
        if page.count("<h1") != 1:
            errors.append(f"{c.slug}: h1 개수 {page.count('<h1')}")
        if 'id="calculator"' not in page:
            errors.append(f"{c.slug}: 계산기 위젯 없음")
        stripped = (page.replace("http://www.sitemaps.org", "")
                        .replace("http://www.w3.org", ""))
        if "http://" in stripped:
            errors.append(f"{c.slug}: http:// 링크")
        for other in channels:
            if other.slug != c.slug and f'href="../{other.slug}/"' not in page \
                    and f'href="./{other.slug}/"' not in page and page.count('../') == 0:
                pass
    # 중복 title/desc
    titles = [c.raw["title"] for c in channels]
    if len(set(titles)) != len(titles):
        errors.append("중복 title 존재")
    descs = [c.raw["desc"] for c in channels]
    if len(set(descs)) != len(descs):
        errors.append("중복 description 존재")

    hub = (out / "index.html").read_text(encoding="utf-8")
    for c in channels:
        if f'./{c.slug}/' not in hub:
            errors.append(f"허브에 {c.slug} 링크 없음")
    for f in ("sitemap.xml", "robots.txt", "assets/style.css", "assets/calc.js"):
        if not (out / f).exists():
            errors.append(f"{f} 없음")
    total = sum(1 for _ in out.rglob("*.html"))
    print(f"\n[검증] HTML {total}개 · 채널 {len(channels)}개 · 오류 {len(errors)}건")
    for e in errors:
        print("  ✗", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
