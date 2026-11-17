/* ==========================================================================
   QuickQuote — 간편견적 PWA
   서버 · 회원가입 · 외부 요청 없이 동작하는 단일 파일 앱 로직.
   * Pro 전환 지점은 아래 CONFIG 한 곳에 모아 두었습니다.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. 설정 — 결제 연동 시 아래 두 값만 채우면 됩니다.
   *    예) proCheckoutUrl: 'https://YOURSTORE.lemonsqueezy.com/checkout/buy/00000000-...'
   *        proWaitlistEmail: 'hello@example.com'  (출시 알림 mailto 수신 주소)
   * ------------------------------------------------------------------ */
  var CONFIG = {
    version: '1.0.0',
    appName: 'QuickQuote',
    siteUrl: 'https://doggonug-cpu.github.io/quick-quote-pwa/',
    // ↓↓↓ Pro 전환 지점 (Lemon Squeezy / Paddle / Stripe Payment Link 등) ↓↓↓
    proCheckoutUrl: '',
    proWaitlistEmail: ''
  };

  /* ------------------------------------------------------------------ *
   * 2. 다국어 사전
   * ------------------------------------------------------------------ */
  var I18N = {
    ko: {
      title: 'QuickQuote — 10초 견적서·거래명세서·간이영수증 (무료 PWA)',
      h1: '10초 만에 끝나는 견적서 — QuickQuote 견적서·거래명세서·간이영수증 무료 작성 도구',
      desc: '회원가입 없이 10초 만에 견적서·거래명세서·간이영수증을 작성하고 PDF로 저장하세요. 설치형 PWA, 오프라인 작동, 한국어·영어 지원.',
      brandTag: '견적서 10초 완성',
      offlineBadge: '오프라인 작동 중',
      install: '설치', installTitle: '홈 화면에 앱으로 설치',
      secType: '문서 종류', typeQuote: '견적서', typeStatement: '거래명세서', typeReceipt: '간이영수증',
      docNo: '문서번호', currency: '통화', issueDate: '발행일', validUntil: '유효기간', paymentDue: '결제기한',
      secSeller: '내 정보 (공급자)', sample: '예시 채우기',
      bizName: '상호 / 이름', owner: '대표자', bizNo: '사업자번호', phone: '연락처', email: '이메일', address: '주소',
      secBuyer: '받는 분 (고객)', buyerName: '고객명 / 상호', contact: '담당자', contactTel: '연락처',
      secItems: '품목', addItem: '항목 추가', itemDesc: '품명', qty: '수량', price: '단가', amount: '금액',
      secTotals: '정산', discount: '할인액', vatMode: '부가세', vatNone: '없음', vatExclusive: '별도', vatInclusive: '포함',
      taxRate: '세율 (%)', payment: '결제 조건', memo: '메모',
      memoPh: '입금 계좌: 하나은행 000-000000-00000',
      secSave: '보관함', save: '저장', library: '불러오기', newDoc: '새 문서',
      saveHint: '모든 자료는 이 기기 브라우저에만 저장됩니다. 서버로 전송되지 않습니다.',
      soon: '출시 예정', proTitle: '브랜드 프로필 · 무제한 보관함',
      pro1: '로고·상호·계좌를 한 번만 등록해 자동 입력',
      pro2: '템플릿 20종 · 세금계산서 양식',
      pro3: '기기 간 자동 백업',
      proCta: '출시 알림 받기',
      proNote: '결제 연동 전이라 지금은 모든 핵심 기능을 무료로 사용할 수 있습니다.',
      preview: '미리보기', share: '공유', print: '인쇄 / PDF 저장',
      printHint: '인쇄 창에서 ‘PDF로 저장’을 선택하면 파일로 보관할 수 있습니다.',
      total: '합계', libEmpty: '저장된 문서가 없습니다. ‘저장’을 누르면 여기에 쌓입니다.',
      docTitle: { quote: '견적서', statement: '거래명세서', receipt: '영수증' },
      docIntro: {
        quote: '아래와 같이 견적을 제출합니다.',
        statement: '아래와 같이 거래 내역을 명세합니다.',
        receipt: '아래와 같이 영수하였습니다.'
      },
      colNo: 'No', colItem: '품목', colQty: '수량', colPrice: '단가', colAmount: '금액',
      toLabel: '수신', issued: '발행일',
      subtotal: '공급가액', discountLabel: '할인', vatLabel: '부가세', vatIncluded: '부가세 (포함)', totalLabel: '합계',
      memoLabel: '메모', signLabel: '발행자', stamp: '영수',
      ownerShort: '대표', bizNoShort: '사업자번호',
      emptyItems: '품목을 입력하면 여기에 표시됩니다.',
      placeholderSeller: '상호를 입력하세요', placeholderBuyer: '받는 분',
      madeWith: 'QuickQuote로 작성',
      toastSaved: '보관함에 저장했습니다.', toastUpdated: '보관함의 문서를 업데이트했습니다.',
      toastDeleted: '삭제했습니다.', toastNew: '새 문서를 시작합니다.',
      toastCopied: '문서 요약을 복사했습니다.', toastSample: '예시 내용을 채웠습니다. 자유롭게 고치세요.',
      toastInstallNo: '브라우저 메뉴에서 ‘홈 화면에 추가’를 선택하면 앱처럼 쓸 수 있습니다.',
      toastPro: 'Pro는 준비 중입니다. 출시되면 이 화면에서 안내드릴게요.',
      toastOffline: '오프라인 상태에서도 계속 작성할 수 있습니다.',
      confirmNew: '현재 내용을 지우고 새 문서를 시작할까요? (저장하지 않은 내용은 사라집니다)',
      confirmDelete: '이 문서를 보관함에서 삭제할까요?',
      draftMeta: '저장',
      langLabel: 'EN', langName: 'English'
    },
    en: {
      title: 'QuickQuote — Quotes, statements & receipts in 10 seconds (free PWA)',
      h1: 'Quotes, statements and receipts in 10 seconds — QuickQuote, a free invoicing tool',
      desc: 'Create a quote, statement of transaction or receipt in 10 seconds and save it as PDF. No sign-up, no server, works offline. Free installable web app.',
      brandTag: 'Quotes in 10 seconds',
      offlineBadge: 'Working offline',
      install: 'Install', installTitle: 'Install as an app',
      secType: 'Document type', typeQuote: 'Quote', typeStatement: 'Statement', typeReceipt: 'Receipt',
      docNo: 'Document no.', currency: 'Currency', issueDate: 'Issue date', validUntil: 'Valid until', paymentDue: 'Payment due',
      secSeller: 'Your details (seller)', sample: 'Fill sample',
      bizName: 'Business / name', owner: 'Representative', bizNo: 'Business no.', phone: 'Phone', email: 'Email', address: 'Address',
      secBuyer: 'Client', buyerName: 'Client / company', contact: 'Contact person', contactTel: 'Phone',
      secItems: 'Line items', addItem: 'Add item', itemDesc: 'Description', qty: 'Qty', price: 'Unit price', amount: 'Amount',
      secTotals: 'Totals & tax', discount: 'Discount', vatMode: 'Tax', vatNone: 'None', vatExclusive: 'Added', vatInclusive: 'Included',
      taxRate: 'Rate (%)', payment: 'Payment terms', memo: 'Notes',
      memoPh: 'Bank transfer details / payment note',
      secSave: 'Saved documents', save: 'Save', library: 'Open', newDoc: 'New',
      saveHint: 'Everything stays in this browser. Nothing is uploaded to a server.',
      soon: 'Coming soon', proTitle: 'Brand profile & unlimited library',
      pro1: 'Save your logo, details and bank info once',
      pro2: '20 templates · tax-invoice layout',
      pro3: 'Automatic backup across devices',
      proCta: 'Notify me at launch',
      proNote: 'No checkout is connected yet — every core feature is free today.',
      preview: 'Preview', share: 'Share', print: 'Print / Save PDF',
      printHint: 'Choose “Save as PDF” in the print dialog to keep a file.',
      total: 'Total', libEmpty: 'No saved documents yet. Press Save to keep one here.',
      docTitle: { quote: 'QUOTATION', statement: 'STATEMENT', receipt: 'RECEIPT' },
      docIntro: {
        quote: 'We are pleased to submit our quotation as follows.',
        statement: 'The following transaction is itemized below.',
        receipt: 'Received with thanks as follows.'
      },
      colNo: 'No', colItem: 'Description', colQty: 'Qty', colPrice: 'Unit price', colAmount: 'Amount',
      toLabel: 'To', issued: 'Issued',
      subtotal: 'Subtotal', discountLabel: 'Discount', vatLabel: 'Tax', vatIncluded: 'Tax (incl.)', totalLabel: 'TOTAL',
      memoLabel: 'Notes', signLabel: 'Issued by', stamp: 'PAID',
      ownerShort: 'Rep.', bizNoShort: 'Reg. no.',
      emptyItems: 'Add a line item to see it here.',
      placeholderSeller: 'Your business name', placeholderBuyer: 'Client',
      madeWith: 'Made with QuickQuote',
      toastSaved: 'Saved to your library.', toastUpdated: 'Library document updated.',
      toastDeleted: 'Deleted.', toastNew: 'Started a new document.',
      toastCopied: 'Summary copied.', toastSample: 'Sample content filled in — edit freely.',
      toastInstallNo: 'Use your browser menu → “Add to Home screen” to install it.',
      toastPro: 'Pro is coming soon. We will announce it right here.',
      toastOffline: 'You can keep working offline.',
      confirmNew: 'Clear the current document and start a new one? (Unsaved changes are lost)',
      confirmDelete: 'Delete this document from the library?',
      draftMeta: 'Saved',
      langLabel: '한국어', langName: '한국어'
    }
  };

  var CURRENCIES = [
    ['KRW', '₩'], ['USD', '$'], ['EUR', '€'], ['JPY', '¥'], ['CNY', '¥'],
    ['GBP', '£'], ['AUD', 'A$'], ['CAD', 'C$'], ['SGD', 'S$'], ['HKD', 'HK$'],
    ['TWD', 'NT$'], ['THB', '฿'], ['VND', '₫'], ['IDR', 'Rp'], ['INR', '₹'],
    ['AED', 'AED'], ['CHF', 'CHF'], ['NZD', 'NZ$'], ['PHP', '₱'], ['MYR', 'RM']
  ];
  var ZERO_DECIMAL = ['KRW', 'JPY', 'VND', 'IDR', 'CLP', 'ISK'];

  var LS = { state: 'qq.v1.state', drafts: 'qq.v1.drafts', lang: 'qq.v1.lang', seen: 'qq.v1.seen' };

  /* ------------------------------------------------------------------ *
   * 3. 상태
   * ------------------------------------------------------------------ */
  var lang = 'ko';
  var state = null;
  var els = {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function t(key) { return (I18N[lang] && I18N[lang][key]) || I18N.ko[key] || key; }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
  function dec(cur) { return ZERO_DECIMAL.indexOf(cur || state.currency) >= 0 ? 0 : 2; }
  function roundTo(n, cur) {
    var d = dec(cur), m = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * m) / m;
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function addDays(iso, days) {
    var p = (iso || todayISO()).split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function formatDate(iso) {
    if (!iso) return '—';
    var p = iso.split('-');
    if (p.length < 3) return iso;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    if (isNaN(d.getTime())) return iso;
    if (lang === 'ko') return p[0] + '. ' + p[1] + '. ' + p[2] + '.';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function fmtMoney(n, cur) {
    cur = cur || state.currency;
    try {
      return new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
        style: 'currency', currency: cur,
        minimumFractionDigits: dec(cur), maximumFractionDigits: dec(cur),
        currencyDisplay: 'narrowSymbol'
      }).format(n);
    } catch (e) {
      return cur + ' ' + (Math.round(n * 100) / 100).toLocaleString();
    }
  }
  function fmtQty(n) {
    var v = Math.round(n * 1000) / 1000;
    return new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US').format(v);
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var parts = path.split('.'), last = parts.pop(), cur = obj;
    parts.forEach(function (k) { if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}; cur = cur[k]; });
    cur[last] = val;
  }

  /* ------------------------------------------------------------------ *
   * 4. 문서 모델 · 계산
   * ------------------------------------------------------------------ */
  function nextDocNo(type, seq) {
    var prefix = type === 'statement' ? 'S' : type === 'receipt' ? 'R' : 'Q';
    var d = new Date();
    var stamp = String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate());
    return prefix + '-' + stamp + '-' + pad(seq || 1);
  }
  function blankState(keepCounter) {
    var seq = 1;
    try { seq = (parseInt(localStorage.getItem('qq.v1.seq'), 10) || 0) + 1; } catch (e) { seq = 1; }
    var s = {
      id: '',
      type: 'quote',
      docNo: nextDocNo('quote', seq),
      date: todayISO(),
      dueDate: addDays(todayISO(), 14),
      currency: 'KRW',
      seller: { name: '', owner: '', bizNo: '', tel: '', email: '', addr: '' },
      buyer: { name: '', contact: '', tel: '' },
      items: [{ desc: '', qty: 1, price: 0 }],
      discount: 0,
      vatMode: 'exclusive',
      taxRate: 10,
      terms: '',
      memo: ''
    };
    return s;
  }

  function calc() {
    var c = state.currency;
    var subtotal = 0;
    var rows = state.items.map(function (it) {
      var amt = roundTo(num(it.qty) * num(it.price), c);
      subtotal = roundTo(subtotal + amt, c);
      return { desc: it.desc, qty: num(it.qty), price: num(it.price), amt: amt };
    });
    var discount = Math.min(Math.max(num(state.discount), 0), subtotal);
    var base = roundTo(subtotal - discount, c);
    var rate = Math.max(0, num(state.taxRate));
    var vat = 0, supply = base, total = base;
    if (state.vatMode === 'exclusive') {
      vat = roundTo(base * rate / 100, c);
      total = roundTo(base + vat, c);
      supply = base;
    } else if (state.vatMode === 'inclusive') {
      vat = roundTo(base - base / (1 + rate / 100), c);
      supply = roundTo(base - vat, c);
      total = base;
    }
    return { rows: rows, subtotal: subtotal, discount: discount, supply: supply, vat: vat, total: total, rate: rate };
  }

  /* ------------------------------------------------------------------ *
   * 5. 렌더 — 문서
   * ------------------------------------------------------------------ */
  function initials(name) {
    var s = (name || '').trim();
    if (!s) return 'QQ';
    if (/^[A-Za-z0-9]/.test(s)) {
      var w = s.split(/\s+/).filter(Boolean);
      return (w.length > 1 ? w[0][0] + w[1][0] : s.slice(0, 2)).toUpperCase();
    }
    return s.slice(0, 1);
  }

  function docHTML() {
    var c = calc();
    var L = I18N[lang];
    var type = state.type;
    var isReceipt = type === 'receipt';

    var sellerLines = [];
    if (state.seller.owner) sellerLines.push(L.ownerShort + ' ' + esc(state.seller.owner));
    if (state.seller.bizNo) sellerLines.push(L.bizNoShort + ' ' + esc(state.seller.bizNo));
    var contact = [state.seller.tel, state.seller.email].filter(Boolean).map(esc).join(' · ');
    if (contact) sellerLines.push(contact);
    if (state.seller.addr) sellerLines.push(esc(state.seller.addr));

    var buyerMeta = [];
    if (state.buyer.contact) buyerMeta.push(esc(state.buyer.contact));
    if (state.buyer.tel) buyerMeta.push(esc(state.buyer.tel));

    var dateRows = '<div><dt>' + L.issued + '</dt><dd>' + formatDate(state.date) + '</dd></div>';
    if (!isReceipt && state.dueDate) {
      dateRows += '<div><dt>' + (type === 'quote' ? L.validUntil : L.paymentDue) + '</dt><dd>' + formatDate(state.dueDate) + '</dd></div>';
    }

    var filled = c.rows.filter(function (r) { return String(r.desc).trim() || r.amt; });
    var bodyRows = '';
    if (filled.length) {
      bodyRows = c.rows.map(function (r, i) {
        return '<tr>' +
          '<td class="col-no">' + (i + 1) + '</td>' +
          '<td class="item-desc">' + (esc(r.desc) || '<span style="color:#a9b3c2">—</span>') + '</td>' +
          '<td>' + fmtQty(r.qty) + '</td>' +
          '<td class="col-price">' + fmtMoney(r.price) + '</td>' +
          '<td class="col-amt">' + fmtMoney(r.amt) + '</td>' +
          '</tr>';
      }).join('');
    } else {
      bodyRows = '<tr class="empty-row"><td colspan="5">' + L.emptyItems + '</td></tr>';
    }

    var totalRows = '<tr><td class="lbl">' + L.subtotal + '</td><td>' + fmtMoney(c.supply) + '</td></tr>';
    if (c.discount > 0) totalRows += '<tr><td class="lbl">' + L.discountLabel + '</td><td>− ' + fmtMoney(c.discount) + '</td></tr>';
    if (state.vatMode !== 'none' && c.vat) {
      totalRows += '<tr><td class="lbl">' + (state.vatMode === 'inclusive' ? L.vatIncluded : L.vatLabel + ' (' + c.rate + '%)') + '</td><td>' + fmtMoney(c.vat) + '</td></tr>';
    }
    totalRows += '<tr class="sum-row"><td class="lbl">' + L.totalLabel + '</td><td>' + fmtMoney(c.total) + '</td></tr>';

    var memoBits = [];
    if (state.memo) memoBits.push(esc(state.memo));
    if (state.terms) memoBits.push(esc(state.terms));
    var memoBlock = memoBits.length
      ? '<div class="doc-memo"><div class="doc-memo-label">' + L.memoLabel + '</div><div class="doc-memo-body">' + memoBits.join('\n') + '</div></div>'
      : '<div></div>';

    var stamp = isReceipt ? '<div class="doc-stamp">' + L.stamp + '</div>' : '';

    return '' +
      '<article class="doc" id="doc" aria-label="' + esc(L.docTitle[type]) + '">' +
        '<div class="doc-head">' +
          '<div class="doc-brand">' +
            '<div class="doc-logo" aria-hidden="true">' + esc(initials(state.seller.name)) + '</div>' +
            '<div>' +
              '<div class="doc-seller-name">' + (esc(state.seller.name) || '<span style="color:#a9b3c2">' + L.placeholderSeller + '</span>') + '</div>' +
              '<div class="doc-seller-meta">' + sellerLines.join('\n') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="doc-title-wrap">' +
            '<div class="doc-title" role="heading" aria-level="2">' + L.docTitle[type] + '</div>' +
            '<div class="doc-no">' + (esc(state.docNo) ? 'No. ' + esc(state.docNo) : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="doc-rule"></div>' +
        '<div class="doc-meta">' +
          '<div>' +
            '<div class="doc-to-label">' + L.toLabel + '</div>' +
            '<div class="doc-to-name">' + (esc(state.buyer.name) || '<span style="color:#a9b3c2">' + L.placeholderBuyer + '</span>') + '</div>' +
            (buyerMeta.length ? '<div class="doc-to-meta">' + buyerMeta.join(' · ') + '</div>' : '') +
          '</div>' +
          '<dl class="doc-dates">' + dateRows + '</dl>' +
        '</div>' +
        '<p class="doc-intro">' + L.docIntro[type] + '</p>' +
        '<table class="doc-table">' +
          '<thead><tr>' +
            '<th class="col-no">' + L.colNo + '</th>' +
            '<th class="col-item">' + L.colItem + '</th>' +
            '<th class="col-qty">' + L.colQty + '</th>' +
            '<th class="col-price">' + L.colPrice + '</th>' +
            '<th class="col-amt">' + L.colAmount + '</th>' +
          '</tr></thead>' +
          '<tbody>' + bodyRows + '</tbody>' +
        '</table>' +
        '<div class="doc-summary">' +
          memoBlock +
          '<table class="doc-totals">' + totalRows + '</table>' +
        '</div>' +
        '<div class="doc-foot">' +
          '<div class="doc-sign">' +
            '<div class="s-company">' + (esc(state.seller.name) || '') +
              '<span>' + L.signLabel + '</span>' +
            '</div>' + stamp +
          '</div>' +
          '<div class="doc-brand-mark">' + L.madeWith + '</div>' +
        '</div>' +
      '</article>';
  }

  function renderDoc() {
    if (!els.docMount) return;
    els.docMount.innerHTML = docHTML();
    var c = calc();
    if (els.totalChip) els.totalChip.textContent = fmtMoney(c.total);
    if (els.bbTotal) els.bbTotal.textContent = fmtMoney(c.total);
    fitPreview();
  }

  /* ------------------------------------------------------------------ *
   * 6. 렌더 — 미리보기 배율
   * ------------------------------------------------------------------ */
  function fitPreview() {
    var stage = els.previewStage, scaler = els.docScaler;
    if (!stage || !scaler) return;
    var doc = $('#doc', stage);
    if (!doc) return;
    var cs = getComputedStyle(stage);
    var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var availW = Math.max(120, stage.clientWidth - padX);
    var docW = doc.offsetWidth || 794;
    var docH = doc.offsetHeight || 1123;
    var s = Math.min(1, availW / docW);
    s = Math.max(0.2, s);
    scaler.style.width = docW + 'px';
    scaler.style.transform = 'scale(' + s + ')';
    scaler.style.marginTop = '0';
    stage.style.height = Math.ceil(docH * s + padY) + 'px';
  }

  /* ------------------------------------------------------------------ *
   * 7. 폼 <-> 상태
   * ------------------------------------------------------------------ */
  function hydrate() {
    $all('[data-path]').forEach(function (el) {
      var v = getPath(state, el.dataset.path);
      el.value = (v === undefined || v === null) ? '' : v;
    });
    if (els.vatSel) renderVatOptions();
    if (els.currencySel) {
      els.currencySel.value = state.currency;
    }
    $all('.seg').forEach(function (b) {
      var on = b.dataset.type === state.type;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    // 유효기간/결제기한 라벨
    if (els.dueLabel) {
      els.dueLabel.textContent = state.type === 'quote' ? t('validUntil') : t('paymentDue');
    }
    if (els.dueField) els.dueField.hidden = state.type === 'receipt';
    renderItems();
    renderDoc();
    updateLibCount();
  }

  function bindFields() {
    $all('[data-path]').forEach(function (el) {
      var evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, function () {
        var path = el.dataset.path;
        var val = el.value;
        if (el.type === 'number') val = val === '' ? '' : num(val);
        setPath(state, path, val);
        if (path === 'currency') { renderItems(); }
        persist();
        renderDoc();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 8. 품목 편집기
   * ------------------------------------------------------------------ */
  function itemRowHTML(it, i) {
    var c = roundTo(num(it.qty) * num(it.price));
    return '<div class="item-row" data-idx="' + i + '">' +
      '<div class="ir-desc"><input type="text" data-item="desc" aria-label="' + esc(t('itemDesc')) + '" placeholder="' + esc(t('itemDesc')) + '" value="' + esc(it.desc) + '"></div>' +
      '<button type="button" class="ir-del" data-del="' + i + '" aria-label="' + (lang === 'ko' ? '이 항목 삭제' : 'Remove item') + '">✕</button>' +
      '<label class="ir-cell qty"><span>' + t('qty') + '</span><input type="number" inputmode="decimal" min="0" step="any" data-item="qty" value="' + esc(it.qty) + '"></label>' +
      '<label class="ir-cell price"><span>' + t('price') + '</span><input type="number" inputmode="decimal" min="0" step="any" data-item="price" value="' + esc(it.price) + '"></label>' +
      '<div class="ir-amt"><span>' + t('amount') + '</span><strong>' + fmtMoney(c) + '</strong></div>' +
      '</div>';
  }

  function renderItems() {
    if (!els.items) return;
    els.items.innerHTML = state.items.map(itemRowHTML).join('');
  }

  function updateRowAmounts() {
    $all('.item-row', els.items).forEach(function (row) {
      var i = Number(row.dataset.idx);
      var it = state.items[i] || {};
      var el = $('.ir-amt strong', row);
      if (el) el.textContent = fmtMoney(roundTo(num(it.qty) * num(it.price)));
    });
  }

  function bindItems() {
    els.items.addEventListener('input', function (e) {
      var input = e.target.closest('input[data-item]');
      if (!input) return;
      var row = input.closest('.item-row');
      var i = Number(row.dataset.idx);
      var field = input.dataset.item;
      var val = field === 'desc' ? input.value : num(input.value);
      if (!state.items[i]) return;
      state.items[i][field] = val;
      updateRowAmounts();
      persist();
      renderDoc();
    });
    els.items.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del]');
      if (!btn) return;
      var i = Number(btn.dataset.del);
      state.items.splice(i, 1);
      if (!state.items.length) state.items.push({ desc: '', qty: 1, price: 0 });
      renderItems();
      persist();
      renderDoc();
    });
  }

  function addItem() {
    state.items.push({ desc: '', qty: 1, price: 0 });
    renderItems();
    persist();
    renderDoc();
    var rows = $all('.item-row', els.items);
    var last = rows[rows.length - 1];
    if (last) {
      var inp = $('input[data-item="desc"]', last);
      if (inp) inp.focus();
    }
  }

  /* ------------------------------------------------------------------ *
   * 9. 저장 / 보관함
   * ------------------------------------------------------------------ */
  function persist() {
    try { localStorage.setItem(LS.state, JSON.stringify(state)); } catch (e) {}
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(LS.state);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.seller && Array.isArray(s.items)) return s;
      }
    } catch (e) {}
    return null;
  }
  function readDrafts() {
    try { return JSON.parse(localStorage.getItem(LS.drafts)) || []; } catch (e) { return []; }
  }
  function writeDrafts(list) {
    try { localStorage.setItem(LS.drafts, JSON.stringify(list)); } catch (e) {}
    updateLibCount();
  }
  function updateLibCount() {
    var n = readDrafts().length;
    if (els.libCount) els.libCount.textContent = n;
  }
  function draftTitle(s) {
    return s.seller && s.seller.name ? s.seller.name : (s.buyer && s.buyer.name ? s.buyer.name : s.docNo);
  }
  function saveDraft() {
    var list = readDrafts();
    var c = calc();
    if (!state.id) state.id = 'd' + Date.now().toString(36);
    var rec = {
      id: state.id,
      savedAt: Date.now(),
      type: state.type,
      title: draftTitle(state),
      sub: I18N[lang].docTitle[state.type] + ' · ' + fmtMoney(c.total) + ' · ' + formatDate(state.date),
      state: JSON.parse(JSON.stringify(state))
    };
    var idx = list.findIndex(function (d) { return d.id === rec.id; });
    var existed = idx >= 0;
    if (existed) list[idx] = rec; else list.unshift(rec);
    writeDrafts(list);
    persist();
    toast(existed ? t('toastUpdated') : t('toastSaved'));
  }
  function renderLibrary() {
    var list = readDrafts();
    if (!els.libList) return;
    els.libList.innerHTML = list.map(function (d) {
      return '<li class="lib-item">' +
        '<button type="button" class="li-main" data-open="' + d.id + '">' +
          '<span class="li-title">' + esc(d.title || d.state.docNo) + '</span>' +
          '<span class="li-sub">' + esc(d.sub || '') + '</span>' +
        '</button>' +
        '<button type="button" class="li-del" data-drop="' + d.id + '" aria-label="' + (lang === 'ko' ? '삭제' : 'Delete') + '">✕</button>' +
      '</li>';
    }).join('');
    var hint = $('#libModal .hint');
    if (hint) hint.style.display = list.length ? 'none' : '';
  }

  /* ------------------------------------------------------------------ *
   * 10. i18n 적용
   * ------------------------------------------------------------------ */
  function applyI18n() {
    document.documentElement.lang = lang;
    $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    $all('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.dataset.i18nPh); });
    $all('[data-i18n-title]').forEach(function (el) { el.title = t(el.dataset.i18nTitle); });
    if (els.langLabel) els.langLabel.textContent = t('langLabel');
    if (els.langBtn) els.langBtn.setAttribute('aria-label', I18N[lang].langName + '로 보기');
    document.title = t('title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('desc'));
    renderVatOptions();
    if (els.dueLabel) els.dueLabel.textContent = state.type === 'quote' ? t('validUntil') : t('paymentDue');
    setUrlLang();
  }
  function setUrlLang() {
    try {
      var url = new URL(location.href);
      if (lang === 'ko') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    } catch (e) {}
  }
  function renderVatOptions() {
    if (!els.vatSel) return;
    var cur = els.vatSel.value || state.vatMode;
    els.vatSel.innerHTML = ['none', 'exclusive', 'inclusive'].map(function (v) {
      var label = v === 'none' ? t('vatNone') : v === 'exclusive' ? t('vatExclusive') : t('vatInclusive');
      return '<option value="' + v + '">' + label + '</option>';
    }).join('');
    els.vatSel.value = cur;
  }

  /* ------------------------------------------------------------------ *
   * 11. 기타 UI
   * ------------------------------------------------------------------ */
  var toastTimer;
  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2600);
  }

  function buildCurrencyOptions() {
    if (!els.currencySel) return;
    els.currencySel.innerHTML = CURRENCIES.map(function (c) {
      return '<option value="' + c[0] + '">' + c[0] + '  ' + c[1] + '</option>';
    }).join('');
    els.currencySel.value = state.currency;
  }

  function sampleData() {
    var ko = lang === 'ko';
    state.seller = ko
      ? { name: '오션 브랜드 스튜디오', owner: '김서준', bizNo: '123-45-67890', tel: '010-2345-6789', email: 'hello@oceanstudio.kr', addr: '서울 마포구 성미산로 12, 3층' }
      : { name: 'Ocean Brand Studio', owner: 'J. Kim', bizNo: '123-45-67890', tel: '+82 10-2345-6789', email: 'hello@oceanstudio.kr', addr: '12 Seongmisan-ro, Mapo-gu, Seoul' };
    state.buyer = ko
      ? { name: '(주)바다수산', contact: '박지훈', tel: '010-9876-5432' }
      : { name: 'Bada Seafood Co.', contact: 'J. Park', tel: '+82 10-9876-5432' };
    state.items = ko
      ? [
          { desc: '브랜드 로고 디자인', qty: 1, price: 900000 },
          { desc: '패키지 시안 2종', qty: 2, price: 250000 },
          { desc: '가이드북 제작', qty: 1, price: 150000 }
        ]
      : [
          { desc: 'Brand logo design', qty: 1, price: 900000 },
          { desc: 'Packaging concepts', qty: 2, price: 250000 },
          { desc: 'Brand guide production', qty: 1, price: 150000 }
        ];
    state.memo = ko ? '입금 계좌: 하나은행 123-456789-00000 (예금주 오션 브랜드 스튜디오)' : 'Bank transfer: Hana Bank 123-456789-00000';
    state.terms = ko ? '계약금 50% / 납품 시 잔금 50%' : '50% deposit, 50% on delivery';
    hydrate();
    persist();
    toast(t('toastSample'));
  }

  function newDoc(force) {
    var dirty = (state.seller.name || state.buyer.name || state.items.some(function (i) { return i.desc; }));
    if (dirty && !force && !confirm(t('confirmNew'))) return;
    try {
      var seq = (parseInt(localStorage.getItem('qq.v1.seq'), 10) || 0) + 1;
      localStorage.setItem('qq.v1.seq', String(seq));
    } catch (e) {}
    state = blankState();
    hydrate();
    persist();
    toast(t('toastNew'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changeType(type) {
    if (type === state.type) return;
    var auto = /^[QSR]-\d{8}-\d{2}$/.test(state.docNo || '');
    state.type = type;
    if (auto) state.docNo = nextDocNo(type);
    if (type === 'receipt') { /* 영수증은 유효기간 없음 */ }
    hydrate();
    persist();
  }

  function printDoc() {
    renderDoc();
    setTimeout(function () { window.print(); }, 60);
  }

  function shareDoc() {
    var c = calc();
    var text = (state.seller.name || CONFIG.appName) + ' · ' + I18N[lang].docTitle[state.type] +
      '\n' + (state.buyer.name ? state.buyer.name + ' / ' : '') + t('totalLabel') + ' ' + fmtMoney(c.total) +
      '\n' + (state.docNo || '');
    if (navigator.share) {
      navigator.share({ title: I18N[lang].docTitle[state.type], text: text }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(t('toastCopied')); }, function () { toast(text); });
    } else {
      toast(text);
    }
  }

  /* ------------------------------------------------------------------ *
   * 12. 초기화
   * ------------------------------------------------------------------ */
  function init() {
    // 언어
    var qs = new URLSearchParams(location.search);
    var qlang = (qs.get('lang') || '').toLowerCase();
    var storedLang = null;
    try { storedLang = localStorage.getItem(LS.lang); } catch (e) {}
    if (qlang === 'en' || qlang === 'ko') lang = qlang;
    else if (storedLang === 'en' || storedLang === 'ko') lang = storedLang;
    else lang = (navigator.language || 'ko').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';

    els = {
      docMount: $('#docMount'),
      docScaler: $('#docScaler'),
      previewStage: $('#previewStage'),
      items: $('#items'),
      currencySel: $('#currencySel'),
      vatSel: $('#vatSel'),
      dueField: $('#dueField'),
      dueLabel: $('#dueLabel'),
      totalChip: $('#totalChip'),
      bbTotal: $('#bbTotal'),
      toast: $('#toast'),
      libCount: $('#libCount'),
      libList: $('#libList'),
      libModal: $('#libModal'),
      langBtn: $('#langBtn'),
      langLabel: $('#langLabel')
    };

    state = loadState() || blankState();
    // PWA 바로가기(?type=quote|statement|receipt)로 열린 경우 해당 양식으로 전환
    var qtype = (qs.get('type') || '').toLowerCase();
    if (['quote', 'statement', 'receipt'].indexOf(qtype) >= 0 && qtype !== state.type) {
      state.type = qtype;
      if (/^[QSR]-\d{8}-\d{2}$/.test(state.docNo || '')) state.docNo = nextDocNo(qtype);
    }
    if (!state.dueDate) state.dueDate = addDays(state.date || todayISO(), 14);
    if (!state.items || !state.items.length) state.items = [{ desc: '', qty: 1, price: 0 }];

    buildCurrencyOptions();
    bindFields();
    bindItems();
    applyI18n();
    hydrate();
    persist();

    // 문서 종류
    $all('.seg').forEach(function (b) {
      b.addEventListener('click', function () { changeType(b.dataset.type); });
    });
    els.langBtn.addEventListener('click', function () {
      lang = lang === 'ko' ? 'en' : 'ko';
      try { localStorage.setItem(LS.lang, lang); } catch (e) {}
      applyI18n();
      renderItems();
      renderLibrary();
      renderDoc();
      persist();
    });

    // 인쇄 / 공유 / 추가 / 저장
    ['printBtn', 'printBtnMobile'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', printDoc);
    });
    var shareBtn = $('#shareBtn'); if (shareBtn) shareBtn.addEventListener('click', shareDoc);
    var addBtn = $('#addItemBtn'); if (addBtn) addBtn.addEventListener('click', addItem);
    var addTop = $('#addItemTop'); if (addTop) addTop.addEventListener('click', addItem);
    var sampleBtn = $('#sampleBtn'); if (sampleBtn) sampleBtn.addEventListener('click', sampleData);
    var saveBtn = $('#saveBtn'); if (saveBtn) saveBtn.addEventListener('click', saveDraft);
    var newBtn = $('#newBtn'); if (newBtn) newBtn.addEventListener('click', function () { newDoc(false); });

    // 보관함
    var openLib = $('#openLibBtn');
    if (openLib) openLib.addEventListener('click', function () {
      renderLibrary();
      els.libModal.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    els.libModal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) {
        els.libModal.hidden = true;
        document.body.style.overflow = '';
        return;
      }
      var open = e.target.closest('[data-open]');
      if (open) {
        var d = readDrafts().filter(function (x) { return x.id === open.dataset.open; })[0];
        if (d) {
          state = JSON.parse(JSON.stringify(d.state));
          state.id = d.id;
          hydrate();
          persist();
          els.libModal.hidden = true;
          document.body.style.overflow = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      var drop = e.target.closest('[data-drop]');
      if (drop) {
        if (!confirm(t('confirmDelete'))) return;
        writeDrafts(readDrafts().filter(function (x) { return x.id !== drop.dataset.drop; }));
        renderLibrary();
        toast(t('toastDeleted'));
      }
    });

    // Pro 훅 — 결제 URL이 채워지면 실제 결제로, 아니면 대기 안내
    var proBtn = $('#proBtn');
    if (proBtn) proBtn.addEventListener('click', function () {
      if (CONFIG.proCheckoutUrl) { window.location.href = CONFIG.proCheckoutUrl; return; }
      if (CONFIG.proWaitlistEmail) {
        var subj = encodeURIComponent('[QuickQuote] Pro 출시 알림 신청');
        var body = encodeURIComponent('QuickQuote Pro 출시 알림을 신청합니다.\n\n앱 버전: ' + CONFIG.version + '\n언어: ' + lang);
        window.location.href = 'mailto:' + CONFIG.proWaitlistEmail + '?subject=' + subj + '&body=' + body;
        return;
      }
      toast(t('toastPro'));
    });

    // 설치 프롬프트
    var deferredPrompt = null;
    var installBtn = $('#installBtn');
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.hidden = false;
    });
    if (installBtn) installBtn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () { deferredPrompt = null; installBtn.hidden = true; });
      } else {
        toast(t('toastInstallNo'));
      }
    });
    window.addEventListener('appinstalled', function () {
      if (installBtn) installBtn.hidden = true;
    });

    // 오프라인 배지
    var badge = $('#offlineBadge');
    function syncOnline() {
      if (!badge) return;
      badge.hidden = navigator.onLine;
    }
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', function () { syncOnline(); toast(t('toastOffline')); });
    syncOnline();

    // 서비스 워커
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', function () {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                toast(lang === 'ko' ? '새 버전이 준비되었습니다. 새로고침하면 적용됩니다.' : 'A new version is ready — reload to apply.');
              }
            });
          });
        }).catch(function () {});
      });
    }

    // 리사이즈 시 미리보기 배율 재계산
    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(fitPreview, 120);
    });
    window.addEventListener('beforeprint', function () {
      if (els.docScaler) els.docScaler.style.transform = 'none';
    });
    window.addEventListener('afterprint', fitPreview);

    // 폰트 로딩 후 배율 보정
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPreview);
    requestAnimationFrame(fitPreview);
    setTimeout(fitPreview, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
