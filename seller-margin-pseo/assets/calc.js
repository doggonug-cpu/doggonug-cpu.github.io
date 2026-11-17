/* MarginCalc — 채널별 마진 계산기 (계산은 브라우저 안에서만 이뤄집니다) */
(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var cfgEl = document.getElementById("calc-config");
  var multiEl = document.getElementById("calc-configs");
  if (!cfgEl && !multiEl) return;

  var cfg = null;
  var bundles = null;
  try {
    if (multiEl) {
      bundles = JSON.parse(multiEl.textContent);
      cfg = bundles.data[bundles.order[0]].cfg;
    } else if (cfgEl) {
      cfg = JSON.parse(cfgEl.textContent);
    }
  } catch (e) { return; }
  if (!cfg) return;

  var VAT = 0.10;
  var $ = function (id) { return document.getElementById(id); };

  function val(id, fallback) {
    var el = $(id);
    if (!el) return fallback || 0;
    var n = parseFloat(String(el.value).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function round(n) { return Math.round(n); }

  function won(n) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    var neg = n < 0;
    var s = Math.abs(round(n)).toLocaleString("ko-KR") + "원";
    return neg ? "-" + s : s;
  }

  function pct(n, digits) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    return n.toFixed(digits === undefined ? 1 : digits) + "%";
  }

  /* ---------- 채널 수수료 ---------- */
  function commissionEx(price) {
    if (cfg.commission_tiers && cfg.commission_tiers.length) {
      var total = 0, prev = 0;
      for (var i = 0; i < cfg.commission_tiers.length; i++) {
        var cap = cfg.commission_tiers[i][0];
        var rate = cfg.commission_tiers[i][1];
        var upper = (cap === null || cap === 0) ? Infinity : cap;
        if (price <= prev) break;
        total += (Math.min(price, upper) - prev) * rate / 100;
        prev = upper;
        if (price <= upper) break;
      }
      return total;
    }
    return price * cfg.commission_pct / 100;
  }

  function commission(price) {
    var amt = commissionEx(price);
    return cfg.commission_vat ? amt * (1 + VAT) : amt;
  }

  function payment(gross, price, shipReceived) {
    var base = gross;
    if (cfg.payment_base === "price") base = price;
    else if (cfg.payment_base === "shipping") base = shipReceived;
    else if (!cfg.payment_base && !cfg.payment_on_shipping) base = price;
    var amt = base * cfg.payment_pct / 100;
    return cfg.payment_vat ? amt * (1 + VAT) : amt;
  }

  function vatAmount(gross, cost) {
    if (cfg.vat_mode === "general") {
      return Math.max(0, (gross - cost) / (1 + VAT) * VAT);
    }
    if (cfg.vat_mode === "simplified") {
      return gross * cfg.vat_simplified_pct / 100;
    }
    return 0;
  }

  /* ---------- 계산 ---------- */
  function compute(inp) {
    var gross = inp.price + inp.shipReceived;
    var comm = commission(inp.price);
    var pay = payment(gross, inp.price, inp.shipReceived);
    var ad = gross * inp.adPct / 100;
    var ret = gross * inp.returnPct / 100;
    var vat = vatAmount(gross, inp.cost);
    var wh = gross * cfg.withholding_pct / 100;
    var monthlyAlloc = cfg.monthly_fee / Math.max(inp.qty, 1);
    var fees = comm + pay;
    var base = inp.cost + inp.shipCost + inp.packaging;
    var totalCost = base + ad + ret + fees + vat + wh + cfg.fixed_per_order + monthlyAlloc;
    var net = gross - totalCost;
    return {
      gross: gross, commission: comm, payment: pay, fees: fees,
      ad: ad, returns: ret, vat: vat, withholding: wh, base: base,
      monthlyAlloc: monthlyAlloc, fixed: cfg.fixed_per_order,
      costTotal: totalCost, net: net,
      margin: gross ? net / gross * 100 : 0,
      feeRate: gross ? fees / gross * 100 : 0,
      settlement: gross - fees - cfg.fixed_per_order - wh - monthlyAlloc,
      platformTotal: fees + cfg.fixed_per_order + monthlyAlloc,
      platformRate: gross ? (fees + cfg.fixed_per_order + monthlyAlloc) / gross * 100 : 0
    };
  }

  function readInputs() {
    return {
      price: val("in-price"),
      cost: val("in-cost"),
      shipReceived: val("in-ship-received"),
      shipCost: val("in-ship-cost"),
      packaging: val("in-packaging"),
      adPct: val("in-ad"),
      returnPct: val("in-return"),
      qty: Math.max(val("in-qty", 1), 1),
      target: val("in-target", 20)
    };
  }

  function netAt(price, inp) {
    var copy = {
      price: price, cost: inp.cost, shipReceived: inp.shipReceived,
      shipCost: inp.shipCost, packaging: inp.packaging, adPct: inp.adPct,
      returnPct: inp.returnPct, qty: inp.qty
    };
    return compute(copy).net;
  }

  function solveBreakeven(inp) {
    var lo = 0, hi = 50000000;
    if (netAt(lo, inp) >= 0) return 0;
    if (netAt(hi, inp) < 0) return null;
    for (var i = 0; i < 70; i++) {
      var mid = (lo + hi) / 2;
      if (netAt(mid, inp) >= 0) hi = mid; else lo = mid;
    }
    return Math.ceil(hi / 10) * 10;
  }

  function solveTarget(inp) {
    var lo = 0, hi = 200000000;
    function g(p) {
      var copy = {
        price: p, cost: inp.cost, shipReceived: inp.shipReceived,
        shipCost: inp.shipCost, packaging: inp.packaging, adPct: inp.adPct,
        returnPct: inp.returnPct, qty: inp.qty
      };
      var r = compute(copy);
      return r.net - r.gross * inp.target / 100;
    }
    if (g(lo) >= 0) return null;
    if (g(hi) < 0) return null;
    for (var i = 0; i < 70; i++) {
      var mid = (lo + hi) / 2;
      if (g(mid) >= 0) hi = mid; else lo = mid;
    }
    return Math.ceil(hi / 10) * 10;
  }

  /* ---------- 화면 반영 ---------- */
  function render() {
    var inp = readInputs();
    var r = compute(inp);
    var be = solveBreakeven(inp);
    var tp = solveTarget(inp);

    var netEl = $("out-net");
    netEl.textContent = won(r.net);
    netEl.classList.toggle("neg", r.net < 0);

    var marginEl = $("out-margin");
    marginEl.textContent = "마진율 " + pct(r.margin) + " · 수수료 " + pct(r.platformRate);
    marginEl.classList.toggle("neg", r.margin < 0);

    if ($("out-gross")) $("out-gross").textContent = won(r.gross);
    if ($("out-commission")) $("out-commission").textContent = "-" + won(r.commission);
    if ($("out-payment")) $("out-payment").textContent = "-" + won(r.payment);
    if ($("out-tax")) $("out-tax").textContent = "-" + won(r.vat + r.withholding);
    if ($("out-var")) $("out-var").textContent = "-" + won(r.ad + r.returns);
    if ($("out-base")) $("out-base").textContent = "-" + won(r.base);
    if ($("out-settlement")) $("out-settlement").textContent = won(r.settlement);
    if ($("out-monthly")) $("out-monthly").textContent = won(Math.round((r.net * inp.qty - cfg.monthly_fee) / 100) * 100);
    if ($("out-breakeven")) {
      $("out-breakeven").textContent = be === null
        ? (netAt(50000000, inp) < 0 ? "어떤 가격에서도 흑자 불가" : "0원에서도 흑자")
        : won(be);
    }
    if ($("out-target")) {
      $("out-target").textContent = tp === null ? "이 원가 구조로는 어려움" : won(tp);
    }
    if ($("out-target-label")) {
      $("out-target-label").textContent = "목표 마진 " + inp.target + "% 판매가";
    }
    if ($("out-comm-label") && cfg.labels) $("out-comm-label").textContent = cfg.labels.commission;
    if ($("out-pay-label") && cfg.labels) $("out-pay-label").textContent = cfg.labels.payment;

    var note = $("out-note");
    if (note) {
      note.classList.toggle("warn", r.net < 0);
      if (r.net < 0) {
        note.textContent = "이 조건에서는 1건 팔 때마다 " + won(-r.net) + " 손실입니다. " +
          (be === null ? "판매가를 올려도 원가·광고비 구조가 나빠 흑자 전환이 어렵습니다."
                       : "판매가를 " + won(be) + " 이상으로 올리거나 원가·광고비를 낮춰야 손익분기가 넘어갑니다.");
      } else {
        note.textContent = "정산금 " + won(r.settlement) + "에서 원가·배송·광고·세금을 빼면 " +
          won(r.net) + "이 남습니다. 부가세·원천징수는 " + won(r.vat + r.withholding) + "으로 계산했습니다.";
      }
    }
  }

  function setVal(id, v) {
    var el = $(id);
    if (el && v !== undefined && v !== null) el.value = String(v);
  }

  function applyBundle(slug) {
    var b = bundles && bundles.data[slug];
    if (!b) return;
    cfg = b.cfg;
    var d = cfg.defaults || {};
    setVal("in-price", d.price);
    setVal("in-cost", d.cost);
    setVal("in-ship-received", d.ship_received);
    setVal("in-ship-cost", d.ship_cost);
    setVal("in-packaging", d.packaging);
    setVal("in-ad", d.ad_pct);
    setVal("in-return", d.return_pct);
    setVal("in-qty", d.monthly_qty);
    setVal("in-target", d.target_margin);
    if ($("calc-title")) $("calc-title").textContent = b.name + " 계산기";
    if ($("calc-basis")) $("calc-basis").textContent = b.basis;
    render();
  }

  var channelSel = $("in-channel");
  if (channelSel && bundles) {
    channelSel.addEventListener("change", function () { applyBundle(channelSel.value); });
    if ($("calc-title") && bundles.data[bundles.order[0]]) {
      $("calc-title").textContent = bundles.data[bundles.order[0]].name + " 계산기";
    }
  }

  var form = $("calc-form");
  if (form) {
    form.addEventListener("input", function (e) {
      if (e.target && e.target.tagName === "INPUT") render();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  }
  render();
})();
