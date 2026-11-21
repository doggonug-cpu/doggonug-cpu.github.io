/* 톡송장 3초 — 화면 동작 (파서는 parser.js). 모든 처리는 브라우저 안에서만 이뤄집니다. */
(function () {
  'use strict';

  var T = window.TalkInvoice;
  if (!T) { return; }
  var L = window.TalkLicense || null;

  /* 결제 동선 설정 — 크몽 상품이 승인되면 아래 kmongUrl 에 상품 주소만 넣으면 됩니다. */
  var PAY = {
    kmongUrl: '',
    pending: '크몽 상품 승인 직후 카드결제 링크가 연결됩니다. 지금 바로 사용하려면 계좌이체 신청(이메일·입금자명)을 남겨 주세요 — 입금 안내를 메일로 보내 드립니다.'
  };

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
    ].join('\n'),
    hell10: T.SAMPLE_HELL10,
    reality: [
      '--- 실제 카톡 8대 유형 테스트 ---',
      '[김미숙] [오전 9:10] 전복 1kg 3박스요. 1개는 우리집(서울 강남구 테헤란로 123 4층), 2개는 어머니댁(부산 해운대구 센텀중앙로 79 101-202 김OO 010-1234-5678) 보내주세요. 보내는 분은 홍길동',
      '[김미숙] [오전 9:20] 전복 2박스',
      '[김미숙] [오전 9:21] 010 1234 5678',
      '[김미숙] [오전 9:22] 수원시 영통구 OO아파트 101-202',
      '[김미숙] [오전 9:24] 아 현관비번 #1234*',
      '[김미숙] [오전 9:25] 3박스로 바꿀게요',
      '[김미숙] [오전 9:40] 사장님 저 박영희예요 저번 주소로 2박스만요 입금했어요!',
      '[김미숙] [오전 9:52] 받는분: 사랑맘',
      '[김미숙] [오전 9:52] 연락처: 010-9999-8888',
      '[김미숙] [오전 9:53] 주소: 제주시 애월읍 하귀리 123 3층',
      '[김미숙] [오전 9:53] 상품: 감귤 5kg 2박스',
      '[김미숙] [오전 9:54] 배송메시지: 아이스팩 넣어서 문 앞에 놓아주시고 도착하면 문자 주세요. 금요일 오후에 도착하면 좋겠습니다. 경비실에도 알려주세요',
      '[김미숙] [오전 10:20] [사진]',
      '[김미숙] [오전 10:21] 사진 보냈어요 확인 부탁드려요',
      '[김미숙] [오전 10:40] 이영희 010-7777-6666 인천시 연수구 송도과학로 32 202호 / 배 3kg 1박스',
      '[김미숙] [오전 10:50] 이영희 010-7777-6666 인천시 연수구 송도과학로 32 202호 / 배 3kg 1박스'
    ].join('\n')
  };

  // 표의 한 칸. stacked 는 한 칸에 입력 두 개(주소 → 기본/상세, 발송/입금).
  var FIELDS = [
    { key: 'name', label: '수취인', cls: 'col-name' },
    { key: 'phone', label: '연락처', cls: 'col-phone' },
    {
      key: 'address', label: '주소', cls: 'col-addr',
      stacked: [
        { key: 'addrBase', label: '기본주소', placeholder: '기본주소' },
        { key: 'addrDetail', label: '상세주소', placeholder: '동·호·층' }
      ]
    },
    { key: 'product', label: '품목', cls: 'col-product' },
    { key: 'qty', label: '수량', cls: 'col-qty' },
    { key: 'memo', label: '배송메시지', cls: 'col-memo' },
    {
      key: 'who', label: '발송/입금', cls: 'col-who',
      stacked: [
        { key: 'sender', label: '발송인', placeholder: '발송인' },
        { key: 'depositor', label: '입금자', placeholder: '입금자' }
      ]
    }
  ];

  var GATE_LABEL = { red: '보류', yellow: '확인', green: '정상' };

  var state = { orders: [], parseTimer: null, license: null, split: null };

  var input = document.getElementById('orderInput');
  var tbody = document.getElementById('orderRows');
  var tableWrap = document.getElementById('tableWrap');
  var emptyState = document.getElementById('emptyState');
  var counts = document.getElementById('counts');
  var countTotal = document.getElementById('countTotal');
  var countOk = document.getElementById('countOk');
  var countWarn = document.getElementById('countWarn');
  var countErr = document.getElementById('countErr');
  var courierSelect = document.getElementById('courier');
  var courierHint = document.getElementById('courierHint');
  var includeDepositor = document.getElementById('includeDepositor');
  var includeSender = document.getElementById('includeSender');
  var btnCsv = document.getElementById('btnCsv');
  var btnCopy = document.getElementById('btnCopy');
  var btnClear = document.getElementById('btnClear');
  var exportStatus = document.getElementById('exportStatus');
  var orderForm = document.getElementById('orderForm');
  var orderStatus = document.getElementById('orderStatus');
  var countPlan = document.getElementById('countPlan');
  var countLock = document.getElementById('countLock');
  var licenseForm = document.getElementById('licenseForm');
  var licenseInput = document.getElementById('licenseInput');
  var licenseState = document.getElementById('licenseState');
  var licenseStatus = document.getElementById('licenseStatus');
  var licenseRemove = document.getElementById('licenseRemove');

  /* ── 라이선스 상태 ────────────────────────────────────── */
  function storage() {
    try { return window.localStorage; } catch (err) { return null; }
  }

  function isPro() { return !!(L && L.isPro(state.license)); }

  function splitInfo() {
    if (!L) { return { pro: true, limit: null, total: state.orders.length, visible: state.orders.length, locked: 0 }; }
    return L.splitOrders(state.orders, state.license);
  }

  function licenseLine() {
    var lic = state.license || { status: 'none' };
    if (!L) { return '라이선스 기능을 불러오지 못했습니다. 새로 고침해 주세요.'; }
    if (lic.status === 'valid') {
      var left = lic.daysLeft;
      return 'Pro 사용 중 — ' + lic.planLabel + ' 이용권, ' + lic.exp + '까지' +
        (typeof left === 'number' && left >= 0 ? ' (' + (left === 0 ? '오늘까지' : left + '일 남음') + ')' : '') + '.';
    }
    if (lic.status === 'expired') {
      return '키가 ' + lic.exp + '에 만료되었습니다. 새 키를 등록하면 다시 열립니다.';
    }
    if (lic.status === 'invalid') {
      return '등록된 키를 확인할 수 없습니다 — ' + lic.reason + '.';
    }
    return '이 브라우저에 등록된 키가 없습니다 — 무료 체험(1회 5건)으로 쓰고 있습니다.';
  }

  function refreshLicenseUI() {
    var lic = state.license || { status: 'none' };
    if (countPlan) {
      countPlan.textContent = lic.status === 'valid' ? ('Pro 무제한 · ' + lic.exp) : '무료 체험 · 1회 5건';
      countPlan.classList.toggle('pro', lic.status === 'valid');
    }
    if (licenseState) {
      licenseState.textContent = licenseLine();
      licenseState.classList.toggle('is-err', lic.status === 'invalid' || lic.status === 'expired');
      licenseState.classList.toggle('is-pro', lic.status === 'valid');
    }
  }

  /* Pro는 택배사 양식·열 선택을 이 브라우저에 기억합니다(무료는 기억하지 않음). */
  function applySavedFormat() {
    if (!L || !isPro()) { return; }
    var fmt = L.readFormat(storage());
    if (!fmt) { return; }
    if (fmt.courier) {
      var hit = false;
      Array.prototype.forEach.call(courierSelect.options, function (opt) { if (opt.value === fmt.courier) { hit = true; } });
      if (hit) { courierSelect.value = fmt.courier; }
    }
    if (includeSender) { includeSender.checked = !!fmt.includeSender; }
    if (includeDepositor) { includeDepositor.checked = !!fmt.includeDepositor; }
  }

  function rememberFormat() {
    if (!L || !isPro()) { return; }
    L.saveFormat(storage(), {
      courier: courierSelect.value,
      includeSender: !!(includeSender && includeSender.checked),
      includeDepositor: !!(includeDepositor && includeDepositor.checked)
    });
  }

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

  function updateCounts(split) {
    split = split || splitInfo();
    var total = state.orders.length;
    var red = 0;
    var yellow = 0;
    state.orders.forEach(function (order) {
      var gate = order.gate || 'green';
      if (gate === 'red') { red += 1; }
      else if (gate === 'yellow') { yellow += 1; }
    });
    var green = total - red - yellow;

    if (countTotal) { countTotal.textContent = total + '건'; }
    if (countOk) {
      countOk.hidden = green === 0;
      countOk.textContent = '정상 ' + green;
    }
    if (countWarn) {
      countWarn.hidden = yellow === 0;
      countWarn.textContent = '확인 ' + yellow;
    }
    if (countErr) {
      countErr.hidden = red === 0;
      countErr.textContent = '보류 ' + red;
    }
    if (countLock) {
      countLock.hidden = split.locked === 0;
      countLock.textContent = 'Pro 잠금 ' + split.locked;
    }

    tableWrap.hidden = total === 0;
    emptyState.hidden = total > 0;
    counts.hidden = total === 0;
    btnCsv.disabled = total === 0;
    btnCopy.disabled = total === 0;
  }

  /* ── 표 그리기 ────────────────────────────────────────── */
  function fieldLabel(key) {
    for (var i = 0; i < FIELDS.length; i++) {
      if (FIELDS[i].key === key) { return FIELDS[i].label; }
      var stack = FIELDS[i].stacked || [];
      for (var j = 0; j < stack.length; j++) {
        if (stack[j].key === key) { return stack[j].label; }
      }
    }
    return key;
  }

  function makeCellInput(order, field, index, placeholder) {
    var el = document.createElement('input');
    el.type = 'text';
    el.className = 'cell-input';
    el.value = order[field] || '';
    el.setAttribute('data-field', field);
    el.setAttribute('aria-label', (index + 1) + '번 주문 ' + fieldLabel(field));
    if (placeholder) { el.placeholder = placeholder; }
    el.spellcheck = false;
    el.autocomplete = 'off';

    el.addEventListener('input', function () {
      applyField(order, field, el.value);
      T.refreshOrder(order);
      T.markDuplicates(state.orders);
      refreshRow(el.closest('tr'), order);
      updateAllFlags();
      updateCounts();
      say(exportStatus, '');
    });

    el.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') { return; }
      event.preventDefault();
      var inputs = Array.prototype.slice.call(tbody.querySelectorAll('input[data-field="' + field + '"]'));
      var at = inputs.indexOf(el);
      var next = inputs[at + 1];
      if (next) { next.focus(); next.select(); }
    });

    return el;
  }

  function applyField(order, field, value) {
    order[field] = value;
    if (field === 'addrBase' || field === 'addrDetail') {
      order.address = ((order.addrBase || '') + ' ' + (order.addrDetail || '')).trim();
    }
  }

  function makeStatusCell(order, index) {
    var td = document.createElement('td');
    td.className = 'cell-status';
    td.setAttribute('data-label', '상태');

    var gate = order.gate || 'green';
    var badge = document.createElement('span');
    badge.className = 'badge ' + (gate === 'red' ? 'badge-error' : gate === 'yellow' ? 'badge-warn' : 'badge-ok');
    badge.textContent = GATE_LABEL[gate] || '정상';
    var issues = order.issues || [];
    if (issues.length) {
      badge.title = issues.map(function (issue) { return issue.message; }).join(' · ');
      badge.setAttribute('aria-label', GATE_LABEL[gate] + ': ' + badge.title);
    }
    td.appendChild(badge);

    if (order.raw && (order.flags || []).length) {
      var peek = document.createElement('button');
      peek.type = 'button';
      peek.className = 'row-peek';
      peek.textContent = '원문';
      peek.setAttribute('aria-expanded', 'false');
      peek.setAttribute('aria-label', (index + 1) + '번 주문 원문 보기');
      peek.addEventListener('click', function () {
        var row = tbody.querySelector('tr.preview-row[data-for="' + index + '"]');
        if (!row) { return; }
        row.hidden = !row.hidden;
        peek.setAttribute('aria-expanded', row.hidden ? 'false' : 'true');
      });
      td.appendChild(peek);
    }

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

  function makeFlagsCell(order) {
    var td = document.createElement('td');
    td.className = 'cell-flags';
    td.setAttribute('data-label', '특수플래그');
    var flags = order.flags || [];
    if (!flags.length) {
      var dash = document.createElement('span');
      dash.className = 'flag-none';
      dash.textContent = '—';
      td.appendChild(dash);
      return td;
    }
    flags.forEach(function (flag) {
      var chip = document.createElement('span');
      chip.className = 'flag-chip ' + flagClass(flag);
      chip.textContent = flag;
      var note = (order.flagNotes || {})[flag];
      if (note) {
        chip.title = note;
        chip.setAttribute('aria-label', flag + ': ' + note);
      }
      td.appendChild(chip);
    });
    return td;
  }

  function flagClass(flag) {
    if (flag.indexOf('수량불일치') === 0 || flag.indexOf('사진') === 0 || flag.indexOf('단골') === 0) { return 'is-red'; }
    if (flag.indexOf('도서산간') === 0) { return 'is-blue'; }
    return 'is-amber';
  }

  function updateAllFlags() {
    Array.prototype.forEach.call(tbody.querySelectorAll('tr.order-row'), function (tr, index) {
      var order = state.orders[index];
      if (!order) { return; }
      var td = tr.querySelector('.cell-flags');
      if (td) { td.replaceWith(makeFlagsCell(order)); }
      tr.classList.toggle('is-error', order.gate === 'red');
      tr.classList.toggle('is-warn', order.gate === 'yellow');
      var preview = tbody.querySelector('tr.preview-row[data-for="' + index + '"]');
      if (preview) {
        var pre = preview.querySelector('pre');
        if (pre) { pre.textContent = order.raw || ''; }
      }
    });
  }

  function refreshRow(tr, order) {
    var issues = order.issues || T.issuesFor(order);
    order.issues = issues;

    tr.classList.toggle('is-error', order.gate === 'red');
    tr.classList.toggle('is-warn', order.gate === 'yellow');

    Array.prototype.forEach.call(tr.querySelectorAll('.cell-input'), function (el) {
      var field = el.getAttribute('data-field');
      var level = levelFor(issues, field);
      el.classList.toggle('is-error', level === 'error');
      el.classList.toggle('is-warn', level === 'warn');
    });

    var td = tr.querySelector('.cell-status');
    if (td) {
      td.replaceWith(makeStatusCell(order, Number(tr.getAttribute('data-index'))));
    }
  }

  function makePreviewRow(order, index) {
    var tr = document.createElement('tr');
    tr.className = 'preview-row';
    tr.setAttribute('data-for', String(index));
    tr.hidden = true;
    var td = document.createElement('td');
    td.colSpan = FIELDS.length + 3;
    var wrap = document.createElement('div');
    wrap.className = 'preview-box';
    var label = document.createElement('p');
    label.className = 'preview-label';
    label.textContent = '원본 대화 미리보기 — 고친 내용이 최종값으로 들어갔는지 확인하세요.';
    var pre = document.createElement('pre');
    pre.textContent = order.raw || '';
    wrap.appendChild(label);
    wrap.appendChild(pre);
    td.appendChild(wrap);
    tr.appendChild(td);
    return tr;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  function makePaywallRow(split) {
    var tr = document.createElement('tr');
    tr.className = 'paywall-row';
    var td = document.createElement('td');
    td.colSpan = FIELDS.length + 3;

    var box = el('div', 'paywall');

    /* 시간 절약(ROI) 배너 — 페이월 안내 바로 위. 건수만 넣으면 그 자리에서 계산합니다. */
    var roi = T.roiSummary(split.total);
    if (roi) {
      var roiBox = el('div', 'roi');
      roiBox.id = 'roiBanner';
      roiBox.appendChild(el('p', 'roi-line', '입력한 ' + roi.count + '건 기준 — ' + roi.line));
      roiBox.appendChild(el('p', 'roi-detail', roi.detail));
      box.appendChild(roiBox);
    }

    box.appendChild(el('p', 'paywall-tag', 'Pro 잠금 — 6번째 행부터'));
    box.appendChild(el('p', 'paywall-title', '입력한 ' + split.total + '건 중 ' + split.locked + '건이 잠겨 있습니다'));
    box.appendChild(el('p', 'paywall-desc',
      '앞의 ' + split.visible + '건은 지금 그대로 표에서 고쳐 쓰고 CSV·엑셀로 내보낼 수 있습니다. ' +
      (split.visible + 1) + '~' + split.total + '번 주문은 Pro 라이선스를 등록하면 이 자리에서 바로 열립니다. ' +
      '무료 체험은 1회 변환 5건까지입니다.'));

    var actions = el('div', 'paywall-actions');
    var kmong = el('button', 'btn btn-primary', 'Pro 1개월 이용권 카드결제 (크몽)');
    kmong.type = 'button';
    kmong.id = 'payKmong';
    var transfer = el('a', 'btn btn-ghost', '계좌이체로 5분 만에 키 받기');
    transfer.setAttribute('href', '#order');
    var register = el('a', 'btn btn-quiet', '이미 키가 있어요 — 등록');
    register.setAttribute('href', '#license');
    actions.appendChild(kmong);
    actions.appendChild(transfer);
    actions.appendChild(register);
    box.appendChild(actions);

    var note = el('p', 'paywall-note', PAY.pending);
    note.id = 'payNotice';
    note.hidden = true;
    box.appendChild(note);

    box.appendChild(el('p', 'paywall-foot',
      '1개월 29,000원 · 3개월 79,000원. 키 한 줄을 등록하면 이 브라우저에서 바로 열립니다. 주문 데이터는 지금도 브라우저 밖으로 나가지 않습니다.'));

    td.appendChild(box);
    tr.appendChild(td);

    kmong.addEventListener('click', function () {
      if (PAY.kmongUrl) {
        window.open(PAY.kmongUrl, '_blank', 'noopener');
        return;
      }
      note.hidden = false;
      transfer.focus();
    });

    return tr;
  }

  function render() {
    tbody.textContent = '';

    if (state.orders.length) { T.markDuplicates(state.orders); }

    var split = splitInfo();
    state.split = split;

    state.orders.slice(0, split.visible).forEach(function (order, index) {
      var tr = document.createElement('tr');
      tr.className = 'order-row';
      tr.setAttribute('data-index', String(index));
      if (order.gate === 'red') { tr.classList.add('is-error'); }
      else if (order.gate === 'yellow') { tr.classList.add('is-warn'); }

      var no = document.createElement('td');
      no.className = 'row-no';
      no.textContent = String(index + 1);
      tr.appendChild(no);

      FIELDS.forEach(function (field) {
        var td = document.createElement('td');
        td.setAttribute('data-label', field.label);
        if (field.cls) { td.className = field.cls; }

        if (field.stacked) {
          var stack = document.createElement('div');
          stack.className = 'cell-stack';
          field.stacked.forEach(function (part) {
            var el = makeCellInput(order, part.key, index, part.placeholder);
            var level = levelFor(order.issues || [], part.key);
            if (level === 'error') { el.classList.add('is-error'); }
            if (level === 'warn') { el.classList.add('is-warn'); }
            stack.appendChild(el);
          });
          td.appendChild(stack);
        } else {
          var el = makeCellInput(order, field.key, index);
          var level = levelFor(order.issues || [], field.key);
          if (level === 'error') { el.classList.add('is-error'); }
          if (level === 'warn') { el.classList.add('is-warn'); }
          td.appendChild(el);
        }
        tr.appendChild(td);
      });

      tr.appendChild(makeFlagsCell(order));
      tr.appendChild(makeStatusCell(order, index));
      tbody.appendChild(tr);
      tbody.appendChild(makePreviewRow(order, index));
    });

    if (split.locked > 0) { tbody.appendChild(makePaywallRow(split)); }

    updateCounts(split);
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
    return {
      includeDepositor: !!(includeDepositor && includeDepositor.checked),
      includeSender: !!(includeSender && includeSender.checked)
    };
  }

  function blockingErrors(rows) {
    return (rows || state.orders).filter(function (order) {
      return (order.issues || T.issuesFor(order)).some(function (issue) { return issue.level === 'error'; });
    }).length;
  }

  /* 무료 체험은 앞의 5건만 내보냅니다. Pro는 전체. */
  function rowsForExport() {
    if (!L) { return state.orders.slice(); }
    return L.exportRows(state.orders, state.license);
  }

  function limitNote(sent) {
    var hidden = state.orders.length - sent;
    if (hidden <= 0) { return ''; }
    return ' 무료 체험은 1회 5건까지 내보냅니다 — 나머지 ' + hidden + '건은 Pro 키를 등록하면 함께 나옵니다.';
  }

  function fileName() {
    var courier = T.courierById(courierSelect.value);
    var now = new Date();
    var stamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    return '톡송장_' + courier.label.replace(/[\s()]+/g, '') + '_' + stamp + '.csv';
  }

  function downloadCsv() {
    if (!state.orders.length) { return; }
    var rows = rowsForExport();
    var bad = blockingErrors(rows);
    if (bad) {
      say(exportStatus, '적색 보류 ' + bad + '건이 있습니다. 빨간 칸을 고치거나 해당 행을 지운 뒤 내려받아 주세요.', true);
      var firstBad = tbody.querySelector('.is-error [data-field]');
      if (firstBad) { firstBad.focus(); }
      return;
    }

    var csv = T.toCSV(rows, courierSelect.value, options());
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
    say(exportStatus, 'CSV 파일을 내려받았습니다 — ' + rows.length + '건, ' + T.courierById(courierSelect.value).label + ' 양식.' + limitNote(rows.length));
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
    var rows = rowsForExport();
    var bad = blockingErrors(rows);
    if (bad) {
      say(exportStatus, '적색 보류 ' + bad + '건이 있습니다. 빨간 칸을 먼저 고쳐 주세요.', true);
      return;
    }
    var tsv = T.toTSV(rows, courierSelect.value, options());
    copyText(tsv).then(function () {
      say(exportStatus, '표를 복사했습니다 — ' + rows.length + '건. 엑셀에서 셀을 고르고 붙여넣으면 열이 맞춰 들어갑니다.' + limitNote(rows.length));
    }).catch(function () {
      say(exportStatus, '복사가 막혔습니다. 표의 칸을 직접 선택해 복사하거나 CSV로 내려받아 주세요.', true);
    });
  }

  /* ── Pro 계좌이체 신청 ────────────────────────────────── */
  function fieldWrap(el) { return el.closest('.field') || el.closest('.check'); }

  function markField(el, bad) {
    var wrap = el ? fieldWrap(el) : null;
    if (wrap) { wrap.classList.toggle('has-error', bad); }
  }

  function submitOrderForm(event) {
    event.preventDefault();

    var period = orderForm.elements['이용 기간'];
    var depositor = orderForm.elements['입금자명'];
    var email = orderForm.elements['email'];
    var consent = orderForm.elements['개인정보 동의'];
    var honey = orderForm.elements['_honey'];

    markField(period, false);
    markField(depositor, false);
    markField(email, false);
    markField(consent, false);

    if (honey && honey.value) {
      say(orderStatus, '신청을 접수했습니다. 감사합니다.');
      orderForm.reset();
      return;
    }

    if (!period.value) {
      markField(period, true);
      say(orderStatus, '이용 기간을 골라 주세요.', true);
      period.focus();
      return;
    }
    if (!depositor.value.trim()) {
      markField(depositor, true);
      say(orderStatus, '입금자명을 적어 주세요(입금하실 때 쓸 이름).', true);
      depositor.focus();
      return;
    }
    if (!email.value || !email.checkValidity()) {
      markField(email, true);
      say(orderStatus, '키와 입금 안내를 받을 이메일 주소를 확인해 주세요.', true);
      email.focus();
      return;
    }
    if (!consent.checked) {
      markField(consent, true);
      say(orderStatus, '입금 안내·키 발급을 위한 이메일·입금자명 수집에 동의해 주세요.', true);
      consent.focus();
      return;
    }

    var endpoint = orderForm.getAttribute('action');
    var data = new URLSearchParams();
    new FormData(orderForm).forEach(function (value, key) {
      if (key === '_honey') { return; }
      data.append(key, value);
    });
    data.append('_captcha', 'false');
    data.append('page', window.location.href);
    data.append('접수 시각', new Date().toISOString());

    var button = orderForm.querySelector('button[type="submit"]');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = '보내는 중…';
    say(orderStatus, '');

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
      orderForm.reset();
      button.textContent = '접수 완료';
      say(orderStatus, '신청을 접수했습니다. 입금 안내와 키 발급 방법을 적어 주신 이메일로 보내 드립니다(메일이 안 보이면 스팸함도 확인해 주세요).');
      window.setTimeout(function () {
        button.disabled = false;
        button.textContent = label;
      }, 4000);
    }).catch(function () {
      window.clearTimeout(timer);
      button.disabled = false;
      button.textContent = label;
      say(orderStatus, '지금은 신청을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.', true);
    });
  }

  /* ── 라이선스 키 등록 ─────────────────────────────────── */
  function submitLicense(event) {
    event.preventDefault();
    if (!L) { say(licenseStatus, '라이선스 기능을 불러오지 못했습니다. 새로 고침해 주세요.', true); return; }
    var token = (licenseInput.value || '').trim();
    if (!token) {
      say(licenseStatus, '이메일로 받은 키(TS3.…)를 붙여넣어 주세요.', true);
      licenseInput.focus();
      return;
    }
    var result = L.saveLicense(storage(), token, Date.now());
    state.license = result;
    refreshLicenseUI();
    render();
    if (result.status === 'valid') {
      licenseInput.value = '';
      say(licenseStatus, 'Pro가 열렸습니다 — ' + result.exp + '까지' +
        (result.stored === false ? ' (이 브라우저에 저장하지 못했습니다: 시크릿 모드일 수 있습니다)' : '') + '.', false);
      applySavedFormat();
      rememberFormat();
    } else if (result.status === 'expired') {
      say(licenseStatus, '만료된 키입니다 — ' + result.reason + '. 새 키를 받아 등록해 주세요.', true);
    } else {
      say(licenseStatus, result.reason || '키를 확인해 주세요.', true);
    }
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
    rememberFormat();
    say(exportStatus, '');
  });

  if (includeDepositor) {
    includeDepositor.addEventListener('change', function () {
      rememberFormat();
      say(exportStatus, includeDepositor.checked ? '입금자명 열을 CSV 끝에 추가합니다.' : '');
    });
  }
  if (includeSender) {
    includeSender.addEventListener('change', function () {
      rememberFormat();
      say(exportStatus, includeSender.checked ? '발송인 열을 CSV 끝에 추가합니다.' : '');
    });
  }

  btnCsv.addEventListener('click', downloadCsv);
  btnCopy.addEventListener('click', copyTsv);

  if (orderForm) { orderForm.addEventListener('submit', submitOrderForm); }
  if (licenseForm) { licenseForm.addEventListener('submit', submitLicense); }
  if (licenseRemove) {
    licenseRemove.addEventListener('click', function () {
      if (L) { L.clearLicense(storage()); }
      state.license = L ? L.readLicense(storage(), Date.now()) : { status: 'none' };
      refreshLicenseUI();
      render();
      say(licenseStatus, '이 브라우저에서 키를 지웠습니다. 무료 체험(1회 5건)으로 돌아갑니다.');
    });
  }

  var year = document.getElementById('year');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  state.license = L ? L.readLicense(storage(), Date.now()) : { status: 'none' };
  applySavedFormat();
  updateCourierHint();
  refreshLicenseUI();
  updateCounts();
})();
