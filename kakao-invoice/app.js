/* 톡송장 3초 — 화면 동작 (파서는 parser.js). 모든 처리는 브라우저 안에서만 이뤄집니다. */
(function () {
  'use strict';

  var T = window.TalkInvoice;
  if (!T) { return; }

  var SAMPLES = {
    farm: [
      '[김미숙] [오전 9:12] ',
      '1. 성함: 박정희',
      '연락처: 010-2345-6789',
      '주소: 전남 완도군 완도읍 장보고대로 123 3층',
      '상품: 완도 활전복 1kg 2박스',
      '입금자: 박정희',
      '',
      '2. 이재훈 010-8765-4321 서울시 송파구 올림픽로 300 101동 1203호',
      '제주 감귤 5kg 1박스',
      '배송메모: 문 앞에 놔주세요',
      '입금자: 이재훈'
    ].join('\n'),
    wholesale: [
      '김하늘 / 010-1234-5678 / 경기도 성남시 분당구 정자일로 100 101동 1001호 / 니트 3장 / 경비실에 맡겨주세요 / 입금자 김하늘',
      '최수빈 / 010-9876-5432 / 인천시 연수구 송도과학로 32 202호 / 코트 2장 / 부재 시 전화 주세요'
    ].join('\n'),
    gift: [
      '1) 받는분: 김영희',
      '전화번호: 010-1111-2222',
      '주소: 부산시 해운대구 센텀중앙로 79 5층',
      '상품명: 한우 선물세트 1호',
      '수량: 1박스',
      '배송메시지: 배송 전 연락 주세요',
      '',
      '2) 받는분: 이철수',
      '전화번호: 010-3333-4444',
      '주소: 대구시 수성구 동대구로 100',
      '상품명: 한우 선물세트 1호',
      '수량: 2박스',
      '배송메시지: 경비실 보관',
      '',
      '3) 받는분: 박영수',
      '전화번호: 010-5555-66',
      '주소: 광주시 서구 상무중앙로 58',
      '상품명: 한우 선물세트 1호'
    ].join('\n')
  };

  var FIELDS = [
    { key: 'name', label: '받는분', width: '' },
    { key: 'phone', label: '연락처', width: '' },
    { key: 'address', label: '주소', width: '' },
    { key: 'product', label: '상품', width: '' },
    { key: 'qty', label: '수량', width: '' },
    { key: 'memo', label: '배송메모', width: '' },
    { key: 'depositor', label: '입금자', width: '' }
  ];

  var state = { orders: [], parseTimer: null };

  var input = document.getElementById('orderInput');
  var tbody = document.getElementById('orderRows');
  var tableWrap = document.getElementById('tableWrap');
  var emptyState = document.getElementById('emptyState');
  var counts = document.getElementById('counts');
  var countTotal = document.getElementById('countTotal');
  var countOk = document.getElementById('countOk');
  var countErr = document.getElementById('countErr');
  var courierSelect = document.getElementById('courier');
  var courierHint = document.getElementById('courierHint');
  var includeDepositor = document.getElementById('includeDepositor');
  var btnCsv = document.getElementById('btnCsv');
  var btnCopy = document.getElementById('btnCopy');
  var btnClear = document.getElementById('btnClear');
  var exportStatus = document.getElementById('exportStatus');
  var proForm = document.getElementById('proForm');
  var proStatus = document.getElementById('proStatus');

  /* ── 공통 ─────────────────────────────────────────────── */
  function levelFor(issues, field) {
    var level = null;
    issues.forEach(function (issue) {
      if (issue.field !== field) { return; }
      if (issue.level === 'error') { level = 'error'; }
      else if (!level) { level = 'warn'; }
    });
    return level;
  }

  function hasError(order) {
    return (order.issues || []).some(function (issue) { return issue.level === 'error'; });
  }

  function say(el, text, isError) {
    if (!el) { return; }
    el.textContent = text || '';
    el.classList.toggle('is-err', !!isError);
  }

  function updateCourierHint() {
    var courier = T.courierById(courierSelect.value);
    courierHint.textContent = '열 구성: ' + courier.note;
  }

  function updateCounts() {
    var total = state.orders.length;
    var bad = 0;
    var warnOnly = 0;
    state.orders.forEach(function (order) {
      if (hasError(order)) { bad += 1; }
      else if ((order.issues || []).length) { warnOnly += 1; }
    });
    var ok = total - bad - warnOnly;
    countTotal.textContent = total + '건';
    countOk.hidden = ok === 0;
    countOk.textContent = '정상 ' + ok;
    countErr.hidden = bad + warnOnly === 0;
    countErr.textContent = '확인 필요 ' + (bad + warnOnly);
    countErr.classList.toggle('err', bad > 0);
    countErr.classList.toggle('warn', bad === 0 && warnOnly > 0);

    tableWrap.hidden = total === 0;
    emptyState.hidden = total > 0;
    counts.hidden = total === 0;
    btnCsv.disabled = total === 0;
    btnCopy.disabled = total === 0;
  }

  /* ── 표 그리기 ────────────────────────────────────────── */
  function makeCellInput(order, field, index) {
    var el = document.createElement('input');
    el.type = 'text';
    el.className = 'cell-input';
    el.value = order[field] || '';
    el.setAttribute('data-field', field);
    el.setAttribute('aria-label', (index + 1) + '번 주문 ' + (FIELDS.filter(function (f) { return f.key === field; })[0] || {}).label);
    el.spellcheck = false;
    el.autocomplete = 'off';

    el.addEventListener('input', function () {
      order[field] = el.value;
      refreshRow(el.closest('tr'), order);
      updateCounts();
      say(exportStatus, '');
    });

    el.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') { return; }
      event.preventDefault();
      var inputs = Array.prototype.slice.call(tbody.querySelectorAll('[data-field="' + field + '"]'));
      var at = inputs.indexOf(el);
      var next = inputs[at + 1];
      if (next) { next.focus(); next.select(); }
    });

    return el;
  }

  function makeStatusCell(order, index) {
    var td = document.createElement('td');
    td.className = 'cell-status';
    td.setAttribute('data-label', '상태');

    var issues = order.issues || [];
    var badge = document.createElement('span');
    if (hasError(order)) {
      badge.className = 'badge badge-error';
      badge.textContent = '확인';
    } else if (issues.length) {
      badge.className = 'badge badge-warn';
      badge.textContent = '확인';
    } else {
      badge.className = 'badge badge-ok';
      badge.textContent = '정상';
    }
    if (issues.length) {
      badge.title = issues.map(function (issue) { return issue.message; }).join(' · ');
      badge.setAttribute('aria-label', '확인 필요: ' + badge.title);
    }
    td.appendChild(badge);

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'row-del';
    del.innerHTML = '&times;';
    del.setAttribute('aria-label', (index + 1) + '번 주문 삭제');
    del.addEventListener('click', function () {
      state.orders.splice(index, 1);
      render();
      say(exportStatus, '주문 1건을 목록에서 지웠습니다. 입력한 원문은 그대로 있습니다.');
    });
    td.appendChild(del);

    return td;
  }

  function refreshRow(tr, order) {
    var issues = T.issuesFor(order);
    order.issues = issues;

    var error = hasError(order);
    tr.classList.toggle('is-error', error);
    tr.classList.toggle('is-warn', !error && issues.length > 0);

    FIELDS.forEach(function (field) {
      var el = tr.querySelector('[data-field="' + field.key + '"]');
      if (!el) { return; }
      var level = levelFor(issues, field.key);
      el.classList.toggle('is-error', level === 'error');
      el.classList.toggle('is-warn', level === 'warn');
    });

    var td = tr.querySelector('.cell-status');
    if (td) {
      var fresh = makeStatusCell(order, Number(tr.getAttribute('data-index')));
      td.replaceWith(fresh);
    }
  }

  function render() {
    tbody.textContent = '';

    state.orders.forEach(function (order, index) {
      var tr = document.createElement('tr');
      tr.setAttribute('data-index', String(index));
      order.issues = T.issuesFor(order);
      var error = hasError(order);
      if (error) { tr.classList.add('is-error'); }
      else if (order.issues.length) { tr.classList.add('is-warn'); }

      var no = document.createElement('td');
      no.className = 'row-no';
      no.textContent = String(index + 1);
      tr.appendChild(no);

      FIELDS.forEach(function (field) {
        var td = document.createElement('td');
        td.setAttribute('data-label', field.label);
        var el = makeCellInput(order, field.key, index);
        var level = levelFor(order.issues, field.key);
        if (level === 'error') { el.classList.add('is-error'); }
        if (level === 'warn') { el.classList.add('is-warn'); }
        td.appendChild(el);
        tr.appendChild(td);
      });

      tr.appendChild(makeStatusCell(order, index));
      tbody.appendChild(tr);
    });

    updateCounts();
  }

  /* ── 파싱 ─────────────────────────────────────────────── */
  function parseNow() {
    state.orders = T.parseOrders(input.value);
    render();
  }

  function scheduleParse() {
    window.clearTimeout(state.parseTimer);
    state.parseTimer = window.setTimeout(parseNow, 140);
  }

  /* ── 내보내기 ─────────────────────────────────────────── */
  function options() {
    return { includeDepositor: !!(includeDepositor && includeDepositor.checked) };
  }

  function blockingErrors() {
    return state.orders.filter(function (order) {
      return (order.issues || T.issuesFor(order)).some(function (issue) { return issue.level === 'error'; });
    }).length;
  }

  function fileName() {
    var courier = T.courierById(courierSelect.value);
    var now = new Date();
    var stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    return '톡송장_' + courier.label.replace(/\s+/g, '') + '_' + stamp + '.csv';
  }

  function downloadCsv() {
    if (!state.orders.length) { return; }
    var bad = blockingErrors();
    if (bad) {
      say(exportStatus, '확인 필요 ' + bad + '건이 있습니다. 빨간 칸을 고치거나 해당 행을 지운 뒤 내려받아 주세요.', true);
      var firstBad = tbody.querySelector('.is-error [data-field]');
      if (firstBad) { firstBad.focus(); }
      return;
    }

    var csv = T.toCSV(state.orders, courierSelect.value, options());
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName();
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1500);
    say(exportStatus, 'CSV 파일을 내려받았습니다 — ' + state.orders.length + '건, ' + T.courierById(courierSelect.value).label + ' 양식.');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
      if (ok) { resolve(); } else { reject(new Error('copy failed')); }
    });
  }

  function copyTsv() {
    if (!state.orders.length) { return; }
    var bad = blockingErrors();
    if (bad) {
      say(exportStatus, '확인 필요 ' + bad + '건이 있습니다. 빨간 칸을 먼저 고쳐 주세요.', true);
      return;
    }
    var tsv = T.toTSV(state.orders, courierSelect.value, options());
    copyText(tsv).then(function () {
      say(exportStatus, '표를 복사했습니다. 엑셀에서 셀을 고르고 붙여넣으면 열이 맞춰 들어갑니다.');
    }).catch(function () {
      say(exportStatus, '복사가 막혔습니다. 표의 칸을 직접 선택해 복사하거나 CSV로 내려받아 주세요.', true);
    });
  }

  /* ── Pro 사전신청 ─────────────────────────────────────── */
  function fieldWrap(el) { return el.closest('.field') || el.closest('.check'); }

  function markField(el, bad) {
    var wrap = fieldWrap(el);
    if (wrap) { wrap.classList.toggle('has-error', bad); }
  }

  function submitInquiry(event) {
    event.preventDefault();

    var orderCount = proForm.elements['하루 주문 건수'];
    var email = proForm.elements['email'];
    var consent = proForm.elements['개인정보 동의'];
    var honey = proForm.elements['_honey'];

    markField(orderCount, false);
    markField(email, false);
    markField(consent, false);

    if (honey && honey.value) {
      say(proStatus, '사전신청을 접수했습니다. 감사합니다.');
      proForm.reset();
      return;
    }

    if (!orderCount.value) {
      markField(orderCount, true);
      say(proStatus, '하루 주문 건수를 골라 주세요.', true);
      orderCount.focus();
      return;
    }
    if (!email.value || !email.checkValidity()) {
      markField(email, true);
      say(proStatus, '회신받을 이메일 주소를 확인해 주세요.', true);
      email.focus();
      return;
    }
    if (!consent.checked) {
      markField(consent, true);
      say(proStatus, '사전신청 안내를 위한 개인정보 수집에 동의해 주세요.', true);
      consent.focus();
      return;
    }

    var endpoint = proForm.getAttribute('action');
    var data = new URLSearchParams();
    new FormData(proForm).forEach(function (value, key) {
      if (key === '_honey') { return; }
      data.append(key, value);
    });
    data.append('_captcha', 'false');
    data.append('page', window.location.href);
    data.append('접수 시각', new Date().toISOString());

    var button = proForm.querySelector('button[type="submit"]');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = '보내는 중…';
    say(proStatus, '');

    var timer;
    var guard = new Promise(function (_, reject) {
      timer = window.setTimeout(function () { reject(new Error('timeout')); }, 15000);
    });

    Promise.race([
      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      }).then(function (res) { return res.json().catch(function () { return {}; }); }),
      guard
    ]).then(function (result) {
      window.clearTimeout(timer);
      var ok = result && (result.success === 'true' || result.success === true);
      if (!ok) { throw new Error('not accepted'); }
      proForm.reset();
      button.textContent = '접수 완료';
      say(proStatus, '사전신청을 접수했습니다. 출시하면 적어 주신 이메일로 먼저 안내드립니다.');
      window.setTimeout(function () {
        button.disabled = false;
        button.textContent = label;
      }, 4000);
    }).catch(function () {
      window.clearTimeout(timer);
      button.disabled = false;
      button.textContent = label;
      say(proStatus, '지금은 신청을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.', true);
    });
  }

  /* ── 이벤트 연결 ──────────────────────────────────────── */
  input.addEventListener('input', scheduleParse);
  input.addEventListener('paste', function () {
    window.clearTimeout(state.parseTimer);
    window.setTimeout(parseNow, 30);
  });

  btnClear.addEventListener('click', function () {
    input.value = '';
    state.orders = [];
    render();
    say(exportStatus, '');
    document.querySelectorAll('.chip[data-sample]').forEach(function (chip) {
      chip.setAttribute('aria-pressed', 'false');
    });
    input.focus();
  });

  document.querySelectorAll('.chip[data-sample]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-sample');
      if (!SAMPLES[key]) { return; }
      input.value = SAMPLES[key];
      document.querySelectorAll('.chip[data-sample]').forEach(function (other) {
        other.setAttribute('aria-pressed', other === chip ? 'true' : 'false');
      });
      parseNow();
      say(exportStatus, '');
      if (window.matchMedia('(max-width: 899px)').matches) {
        var resultTitle = document.getElementById('result-title');
        if (resultTitle) { resultTitle.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });

  courierSelect.addEventListener('change', function () {
    updateCourierHint();
    say(exportStatus, '');
  });

  if (includeDepositor) {
    includeDepositor.addEventListener('change', function () {
      say(exportStatus, includeDepositor.checked ? '입금자명 열을 CSV 끝에 추가합니다.' : '');
    });
  }

  btnCsv.addEventListener('click', downloadCsv);
  btnCopy.addEventListener('click', copyTsv);

  if (proForm) { proForm.addEventListener('submit', submitInquiry); }

  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  updateCourierHint();
  updateCounts();
})();
