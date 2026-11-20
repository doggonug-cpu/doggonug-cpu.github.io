/*!
 * 톡송장 3초 — 카톡 주문 텍스트 → 택배 송장 데이터 파서
 * 의존성 0개. 브라우저에서는 window.TalkInvoice, Node에서는 module.exports 로 씁니다.
 * 입력한 이름·전화·주소는 이 파일 안에서만 처리되며 어디로도 전송되지 않습니다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.TalkInvoice = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ── 라벨 사전 ─────────────────────────────────────────────── */
  var LABEL_GROUPS = [
    ['address',   ['배송지주소', '배송주소', '받으실곳', '받으시는곳', '받는곳', '도착지', '주소지', '주소']],
    ['depositor', ['입금자명', '입금자', '송금자', '보내는분', '예금주', '주문자']],
    ['memo',      ['배송메세지', '배송메시지', '배송요청사항', '배송메모', '요청사항', '배송요청', '요청', '메모', '비고']],
    ['product',   ['주문상품', '상품명', '품목명', '물품명', '품명', '상품', '물건', '품목']],
    ['phone',     ['휴대폰번호', '휴대전화번호', '전화번호', '휴대전화', '휴대폰', '핸드폰', '연락처', '전화', '번호']],
    ['name',      ['받는분성명', '받는분', '받는사람', '받으실분', '받으시는분', '수취인명', '수취인', '수령인', '성함', '이름']],
    ['qty',       ['수량', '개수']]
  ];

  var LABEL_FIELD = {};
  var LABEL_LIST = [];
  var LABELS_BY_FIELD = {};
  LABEL_GROUPS.forEach(function (group) {
    LABELS_BY_FIELD[group[0]] = group[1].slice();
    group[1].forEach(function (label) {
      LABEL_FIELD[label] = group[0];
      LABEL_LIST.push(label);
    });
  });
  LABEL_LIST.sort(function (a, b) { return b.length - a.length; });

  var LABEL_RE_SRC = LABEL_LIST.map(function (label) {
    return label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|');

  var LABEL_COLON_RE = new RegExp('^(?:\\[)?(' + LABEL_RE_SRC + ')(?:\\])?[ \\t]*[:：=][ \\t]*');
  var LABEL_SPACE_RE = new RegExp('^(?:\\[)?(' + LABEL_RE_SRC + ')(?:\\])?[ \\t]+(?=\\S)');
  var LABEL_COMMA_RE = new RegExp('[,，][ \\t]*(?=(?:\\[)?(?:' + LABEL_RE_SRC + ')(?:\\])?[ \\t]*[:：=])', 'g');
  var NAME_LABEL_AT_START_RE = new RegExp('^[ \\t]*(?:\\[)?(?:받는분|받는사람|받으실분|받으시는분|수취인|수령인|성함|이름)(?:\\])?[ \\t]*[:：]');

  /* ── 수량·상품 패턴 ────────────────────────────────────────── */
  // 개수 단위는 수량 열로, 무게·부피 단위(kg, ml …)는 상품명의 일부로 남깁니다.
  var COUNT_UNITS = '개|박스|세트|팩|봉지|봉|병|장|매|포|줄|켤레|쌍|송이|단|근|마리|대|권';
  var QTY_UNITS = COUNT_UNITS + '|kg|킬로그램|킬로|g|그램|ml|리터|L';
  var COUNT_TOKEN = '\\d+[ \\t]*(?:' + COUNT_UNITS + ')(?![가-힣])';
  var QTY_TOKEN = '\\d+[ \\t]*(?:' + QTY_UNITS + ')(?![가-힣])';
  var PRODUCT_SPLIT_RE = new RegExp('^(.*\\S)[ \\t]*(?:[/×xX*][ \\t]*)?(' + COUNT_TOKEN + '(?:[ \\t]*' + COUNT_TOKEN + ')*)$', 'i');
  var PRODUCT_QTY_TEST_RE = new RegExp(QTY_TOKEN, 'i');
  var MULTIPLY_RE = /[×xX*][ \t]*\d+/;

  /* ── 주소·메모·이름 추정 ────────────────────────────────────── */
  var STRONG_ADDRESS_RE = new RegExp(
    '(?:특별시|광역시|특별자치시|특별자치도|자치도)' +
    '|(?:[가-힣]{1,10}(?:로|길)[ \\t]*\\d)' +
    '|(?:\\d+[ \\t]*(?:번지|번길|동|호|층))' +
    '|(?:아파트|빌라|오피스텔|빌딩|타워|맨션|주택|상가)' +
    '|(?:[가-힣]{1,10}(?:시|군|구)[ \\t]+[가-힣]{1,10}(?:구|군|읍|면|동|리))'
  );
  var WEAK_ADDRESS_RE = /(?:시|도|구|군|읍|면|동|리|로|길)[ \t]/;
  var MEMO_HINTS_RE = /(문[ \t]*앞|문앞|경비실|부재|배송[ \t]*전|전화[ \t]*(주|해|바|요)|놔[ \t]*주|놓아|맡겨|놓으|조심|파손|깨지|빠른[ \t]*배송|오전[ \t]*배송|오후[ \t]*배송|시간[ \t]*지정|요청|메모|비닐|봉투|박스에|포장|냉동|냉장|현관)/;
  var DEPOSITOR_INLINE_RE = /^(?:입금(?:자|자명)?|송금자|보내는분|예금주)[ \t]*[:：]?[ \t]*(\S.{0,20})$/;
  var NAME_ONLY_RE = /^[가-힣A-Za-z][가-힣A-Za-z \t·.]{0,15}$/;

  /* ── 전화번호 ─────────────────────────────────────────────── */
  var MOBILE_RE = /(?:\+?82[-\s.]?)?(0?1[016789])[-\s.]?(\d{3,4})[-\s.]?(\d{4})(?!\d)/;
  var LANDLINE_RE = /(0[2-6]\d{0,2})[-\s.]?(\d{3,4})[-\s.]?(\d{4})(?!\d)/;

  function normalizePhone(raw) {
    var digits = String(raw == null ? '' : raw).replace(/[^0-9+]/g, '');
    if (digits.charAt(0) === '+') { digits = digits.slice(1); }
    if (digits.indexOf('82') === 0 && digits.length >= 11) { digits = '0' + digits.slice(2); }
    else if (digits.indexOf('10') === 0 && digits.length >= 10) { digits = '0' + digits; }

    var isMobile = /^01[016789]/.test(digits);
    var valid = false;
    if (isMobile) {
      valid = digits.length === 11 || (digits.length === 10 && /^01[16789]/.test(digits));
    } else if (/^0[2-6]/.test(digits)) {
      valid = digits.length >= 9 && digits.length <= 11;
    }

    var formatted = digits;
    if (digits.length === 11) {
      formatted = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7);
    } else if (digits.length === 10) {
      formatted = digits.slice(0, 2) === '02'
        ? digits.slice(0, 2) + '-' + digits.slice(2, 6) + '-' + digits.slice(6)
        : digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
    } else if (digits.length === 9 && digits.slice(0, 2) === '02') {
      formatted = '02-' + digits.slice(2, 5) + '-' + digits.slice(5);
    }

    // 자릿수가 틀린 값은 임의로 고치지 않고 입력한 모양 그대로 돌려줘서 고치게 합니다.
    return { value: valid ? formatted : String(raw == null ? '' : raw).trim(), digits: digits, valid: valid };
  }

  function findPhone(text) {
    var m = MOBILE_RE.exec(text);
    if (m) { return { raw: m[0], start: m.index, end: m.index + m[0].length }; }
    m = LANDLINE_RE.exec(text);
    if (m) { return { raw: m[0], start: m.index, end: m.index + m[0].length }; }
    return null;
  }

  /* ── 입력 정리 ────────────────────────────────────────────── */
  function cleanInput(raw) {
    var s = String(raw == null ? '' : raw);
    s = s.replace(/\r\n?/g, '\n')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .replace(/\u00a0/g, ' ');
    // 카톡 내보내기 날짜 구분선 / 대시 구분선 → 주문 경계
    s = s.replace(/^[ \t]*[-=ㅡ_]{3,}[^\n]*$/gm, '\n\n');
    // PC·Mac 내보내기: "2024년 5월 12일 오후 3:12, 김철수 : 내용" → 메시지 하나가 한 덩어리
    s = s.replace(/^[ \t]*\d{4}년[ \t]*\d{1,2}월[ \t]*\d{1,2}일[ \t]*(?:오전|오후)?[ \t]*\d{1,2}:\d{2}[ \t]*,[ \t]*[^:\n]{1,30}?[ \t]*:[ \t]?/gm, '\n\n');
    // 모바일 내보내기: "[김철수] [오전 10:12] 내용" → 한 메시지가 한 덩어리
    s = s.replace(/^[ \t]*\[[^\]\n]{1,30}\][ \t]*\[(?:오전|오후)?[ \t]*\d{1,2}:\d{2}\][ \t]*/gm, '\n\n');
    // 인용 표시 "> "
    s = s.replace(/^[ \t]*>[ \t]?/gm, '');
    return s;
  }

  function splitNumbered(paragraph) {
    var lines = paragraph.split('\n');
    var out = [];
    var cur = [];
    function flush() {
      var block = cur.join('\n').trim();
      if (block) { out.push(block); }
      cur = [];
    }
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (/^(?:\d{1,2}[.)]|\(\d{1,2}\)|\[\d{1,2}\]|[①-⑳])$/.test(trimmed)) { flush(); return; }
      var m = trimmed.match(/^(?:\d{1,2}[.)]|\(\d{1,2}\)|\[\d{1,2}\]|#\d{1,2}|[①-⑳])[ \t]*(\S.*)$/);
      if (m) { flush(); cur.push(m[1]); return; }
      cur.push(line);
    });
    flush();
    return out;
  }

  function firstLabelField(text) {
    var line = String(text || '').split('\n')[0] || '';
    var m = line.match(LABEL_COLON_RE) || line.match(LABEL_SPACE_RE);
    return m ? LABEL_FIELD[m[1]] : null;
  }

  function fieldHasLabel(text, field) {
    var labels = LABELS_BY_FIELD[field] || [];
    for (var i = 0; i < labels.length; i++) {
      if (text.indexOf(labels[i]) !== -1) { return true; }
    }
    return false;
  }

  // 빈 줄로 갈라진 조각이
  //  ① 앞 조각에 없는 라벨로 시작하거나 (예: 전화:, 주소:
  //  ② 번호만 달랑 시작하거나
  //  ③ 앞 조각에 연락처만 있고 주소가 비었는데 주소 같은 줄이 오면 한 주문으로 붙입니다.
  // 번호(1. 2.)로 명시된 블록은 절대 합치지 않습니다.
  function mergeContinuations(blocks) {
    var out = [];
    blocks.forEach(function (block) {
      var prev = out.length ? out[out.length - 1] : null;
      var startsWithNameLabel = NAME_LABEL_AT_START_RE.test(block.text);
      var labelField = firstLabelField(block.text);
      var startsBarePhone = /^[\s(]*(?:\+?82|0)[\d\s.\-]{7,}/.test(block.text);
      var continues = false;
      if (prev && !block.explicit && !startsWithNameLabel) {
        if (labelField && !fieldHasLabel(prev.text, labelField)) {
          continues = true;
        } else if (startsBarePhone && !findPhone(prev.text)) {
          continues = true;
        } else if (!findPhone(block.text) && findPhone(prev.text) &&
                   !looksLikeAddress(prev.text) && looksLikeAddress(block.text)) {
          continues = true;
        }
      }
      if (continues) {
        prev.text = prev.text + '\n' + block.text;
      } else {
        out.push({ text: block.text, explicit: block.explicit });
      }
    });
    return out;
  }

  /* ── 주문 1건 파싱 ────────────────────────────────────────── */
  function blankOrder() {
    return {
      name: '', phone: '', phoneRaw: '', address: '', product: '', qty: '', memo: '', depositor: '',
      issues: [], _touched: false, _fromLabel: {}
    };
  }

  function joinPart(base, extra, sep) {
    var value = String(extra == null ? '' : extra).trim();
    if (!value) { return base || ''; }
    if (!base) { return value; }
    if (base === value) { return base; }
    return base + (sep || ' ') + value;
  }

  function addProduct(order, text) {
    var value = String(text || '').replace(/^(?:상품|품목|물건|품명)[ \t]*[:：]?[ \t]*/, '').trim();
    if (!value) { return; }
    order._touched = true;
    var m = value.match(PRODUCT_SPLIT_RE);
    if (m && m[1]) {
      order.product = joinPart(order.product, m[1].trim(), ' / ');
      order.qty = joinPart(order.qty, m[2].trim(), ' / ');
    } else {
      order.product = joinPart(order.product, value, ' / ');
    }
  }

  function looksLikeAddress(text) {
    if (STRONG_ADDRESS_RE.test(text)) { return true; }
    if (PRODUCT_QTY_TEST_RE.test(text) || MULTIPLY_RE.test(text)) { return false; }
    if (!/[0-9]/.test(text)) { return false; }
    return WEAK_ADDRESS_RE.test(text);
  }

  function looksLikeMemo(text) {
    return MEMO_HINTS_RE.test(text);
  }

  function looksLikeName(text) {
    return NAME_ONLY_RE.test(text) && !looksLikeAddress(text) && !looksLikeMemo(text);
  }

  function looksLikeQuantityLine(text) {
    return PRODUCT_QTY_TEST_RE.test(text) || MULTIPLY_RE.test(text);
  }

  function assignFreeText(text, order, afterPhone) {
    var t = String(text || '').replace(/^[-–—,·•*]+|[-–—,·•*]+$/g, '').trim();
    if (!t) { return; }

    var inlineDepositor = t.match(DEPOSITOR_INLINE_RE);
    if (inlineDepositor && !order.depositor) {
      order.depositor = inlineDepositor[1].replace(/[ \t]*(?:입니다|이요|이에요|요)$/, '').trim();
      order._touched = true;
      return;
    }

    if (looksLikeAddress(t)) {
      order.address = joinPart(order.address, t);
      order._touched = true;
      return;
    }
    if (looksLikeQuantityLine(t)) {
      addProduct(order, t);
      return;
    }
    if (looksLikeMemo(t)) {
      order.memo = joinPart(order.memo, t, ' / ');
      order._touched = true;
      return;
    }
    if (!order.name && looksLikeName(t)) {
      order.name = t;
      order._touched = true;
      return;
    }
    if (!order.name && !afterPhone) {
      order.name = t;
      order._touched = true;
      return;
    }
    if (!order.address) {
      order.address = t;
      order._touched = true;
      return;
    }
    addProduct(order, t);
  }

  function assignLabeled(field, rawValue, order) {
    var value = String(rawValue || '').trim().replace(/^[-–—,·•*]+|[-–—,·•*]+$/g, '').trim();
    if (!value) { return; }
    order._touched = true;
    switch (field) {
      case 'phone':
        // 라벨이 붙은 값은 자유형에서 짐작한 값보다 우선합니다.
        if (!order.phone || !order._fromLabel.phone) {
          var normalized = normalizePhone(value);
          order.phoneRaw = value;
          order.phone = normalized.value;
          order._fromLabel.phone = true;
        }
        break;
      case 'name':
        if (!order.name || !order._fromLabel.name) {
          order.name = value;
          order._fromLabel.name = true;
        }
        break;
      case 'address':
        if (order.address && !order._fromLabel.address) {
          order.address = value;
        } else {
          order.address = joinPart(order.address, value);
        }
        order._fromLabel.address = true;
        break;
      case 'product':
        addProduct(order, value);
        break;
      case 'qty':
        order.qty = joinPart(order.qty, value, ' / ');
        break;
      case 'memo':
        order.memo = joinPart(order.memo, value, ' / ');
        break;
      case 'depositor':
        if (!order.depositor) { order.depositor = value; }
        break;
      default:
        break;
    }
  }

  function matchLabeled(unit) {
    var m = unit.match(LABEL_COLON_RE);
    if (m) { return { field: LABEL_FIELD[m[1]], value: unit.slice(m[0].length) }; }
    m = unit.match(LABEL_SPACE_RE);
    if (m) { return { field: LABEL_FIELD[m[1]], value: unit.slice(m[0].length) }; }
    return null;
  }

  function parseBlock(block) {
    var text = block.replace(LABEL_COMMA_RE, '\n');
    var lines = text.split('\n');
    var orders = [];
    var order = blankOrder();

    function flush() {
      if (order._touched) { orders.push(validate(order)); }
      order = blankOrder();
    }

    function takeUnit(unit) {
      var u = String(unit || '').replace(/^[ \t\-•*·:]+/, '').replace(/[ \t]+$/, '');
      if (!u) { return; }
      if (/^[-=ㅡ_]{3,}$/.test(u)) { return; }

      var labeled = matchLabeled(u);
      if (labeled) { assignLabeled(labeled.field, labeled.value, order); return; }

      var phone = findPhone(u);
      if (phone) {
        if (!order.phone) {
          var normalized = normalizePhone(phone.raw);
          order.phoneRaw = phone.raw;
          order.phone = normalized.value;
          order._touched = true;
        }
        var before = u.slice(0, phone.start).replace(/[,\s\-–—()]+$/, '').trim();
        var after = u.slice(phone.end).replace(/^[,\s\-–—()]+/, '').trim();
        if (before) { assignFreeText(before, order, false); }
        if (after) { assignFreeText(after, order, true); }
        return;
      }

      assignFreeText(u, order, false);
    }

    lines.forEach(function (line) {
      // 한 줄에 한 주문씩 적힌 경우: 이름·번호·주소가 다 채워진 뒤
      // 다른 번호나 새 받는분 라벨이 나오면 다음 주문으로 넘어갑니다.
      var linePhone = findPhone(line);
      var startsName = NAME_LABEL_AT_START_RE.test(line);
      var differentPhone = linePhone && order.phone &&
        normalizePhone(linePhone.raw).digits !== normalizePhone(order.phone).digits;
      if (order.name && order.phone && order.address && (differentPhone || startsName)) {
        flush();
      }
      line.split(/[\/|｜\t]+/).forEach(takeUnit);
    });
    flush();
    return orders;
  }

  function buildIssues(order) {
    var issues = [];
    if (!order.phone) {
      issues.push({ field: 'phone', level: 'error', message: '연락처가 없습니다' });
    } else {
      var p = normalizePhone(order.phone);
      if (!p.valid) {
        issues.push({ field: 'phone', level: 'error', message: '연락처 자릿수를 확인하세요' });
      }
    }
    if (!order.name) {
      issues.push({ field: 'name', level: 'warn', message: '받는분 이름이 없습니다' });
    }
    if (!order.address) {
      issues.push({ field: 'address', level: 'error', message: '주소가 없습니다' });
    } else if (order.address.replace(/\s/g, '').length < 6) {
      issues.push({ field: 'address', level: 'warn', message: '주소가 짧습니다 — 상세주소를 확인하세요' });
    }
    if (!order.product) {
      issues.push({ field: 'product', level: 'warn', message: '상품명이 없습니다' });
    }
    return issues;
  }

  function validate(order) {
    if (order.phone) {
      order.phone = normalizePhone(order.phone).value;
    }
    order.issues = buildIssues(order);
    delete order._touched;
    delete order._fromLabel;
    delete order.phoneRaw;
    return order;
  }

  function parseOrders(raw) {
    var text = cleanInput(raw);
    if (!text.trim()) { return []; }
    var paragraphs = text.split(/\n[ \t]*\n+/);
    var blocks = [];
    paragraphs.forEach(function (paragraph) {
      var parts = splitNumbered(paragraph);
      var explicit = parts.length > 1;
      parts.forEach(function (block) {
        var trimmed = block.trim();
        if (trimmed) { blocks.push({ text: trimmed, explicit: explicit }); }
      });
    });
    blocks = mergeContinuations(blocks);

    var orders = [];
    blocks.forEach(function (block) {
      parseBlock(block.text).forEach(function (order) {
        // 인사·잡담처럼 사장 정보가 거의 없는 덩어리는 주문으로 만들지 않습니다.
        // (연락처·주소가 있거나, 이름과 상품이 함께 있어야 한 건으로 봅니다.)
        var meaningful = order.phone || order.address || (order.name && order.product);
        if (meaningful) { orders.push(order); }
      });
    });
    return orders;
  }

  /* ── 택배사 양식 ──────────────────────────────────────────── */
  var COURIERS = [
    {
      id: 'cj',
      label: 'CJ대한통운',
      note: '받는분성명 · 받는분전화번호 · 받는분주소 · 상품명 · 수량 · 배송메세지 · 운송장번호',
      columns: [
        { header: '받는분성명', key: 'name' },
        { header: '받는분전화번호', key: 'phone' },
        { header: '받는분주소', key: 'address' },
        { header: '상품명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메세지', key: 'memo' },
        { header: '운송장번호', key: 'waybill' }
      ]
    },
    {
      id: 'rosen',
      label: '로젠택배',
      note: '수취인명 · 수취인전화번호 · 수취인주소 · 상품명 · 수량 · 배송메모 · 운송장번호',
      columns: [
        { header: '수취인명', key: 'name' },
        { header: '수취인전화번호', key: 'phone' },
        { header: '수취인주소', key: 'address' },
        { header: '상품명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메모', key: 'memo' },
        { header: '운송장번호', key: 'waybill' }
      ]
    },
    {
      id: 'hanjin',
      label: '한진택배',
      note: '받는분 · 전화번호 · 주소 · 상품명 · 수량 · 배송메시지 · 운송장번호',
      columns: [
        { header: '받는분', key: 'name' },
        { header: '전화번호', key: 'phone' },
        { header: '주소', key: 'address' },
        { header: '상품명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메시지', key: 'memo' },
        { header: '운송장번호', key: 'waybill' }
      ]
    },
    {
      id: 'lotte',
      label: '롯데택배',
      note: '수취인 · 전화번호 · 주소 · 품명 · 수량 · 배송메시지 · 운송장번호',
      columns: [
        { header: '수취인', key: 'name' },
        { header: '전화번호', key: 'phone' },
        { header: '주소', key: 'address' },
        { header: '품명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메시지', key: 'memo' },
        { header: '운송장번호', key: 'waybill' }
      ]
    },
    {
      id: 'post',
      label: '우체국택배',
      note: '수취인성명 · 전화번호 · 주소 · 품명 · 수량 · 배송메시지 · 등기번호',
      columns: [
        { header: '수취인성명', key: 'name' },
        { header: '전화번호', key: 'phone' },
        { header: '주소', key: 'address' },
        { header: '품명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메시지', key: 'memo' },
        { header: '등기번호', key: 'waybill' }
      ]
    },
    {
      id: 'smartstore',
      label: '스마트스토어 일괄발송',
      note: '상품주문번호 · 배송방법 · 택배사 · 송장번호 (송장 일괄등록용 4열)',
      columns: [
        { header: '상품주문번호', key: 'orderNo' },
        { header: '배송방법', key: 'method' },
        { header: '택배사', key: 'carrier' },
        { header: '송장번호', key: 'waybill' }
      ]
    }
  ];

  function courierById(id) {
    for (var i = 0; i < COURIERS.length; i++) {
      if (COURIERS[i].id === id) { return COURIERS[i]; }
    }
    return COURIERS[0];
  }

  function columnsFor(courierId, options) {
    var courier = courierById(courierId);
    var cols = courier.columns.slice();
    if (options && options.includeDepositor && courier.id !== 'smartstore') {
      cols.push({ header: '입금자명', key: 'depositor' });
    }
    return cols;
  }

  function valueFor(order, key) {
    switch (key) {
      case 'name': return order.name || '';
      case 'phone': return order.phone || '';
      case 'address': return order.address || '';
      case 'product': return order.product || '';
      case 'qty': return order.qty || '';
      case 'memo': return order.memo || '';
      case 'depositor': return order.depositor || '';
      case 'carrier': return 'CJ대한통운';
      case 'method': return '택배';
      case 'waybill': return '';
      case 'orderNo': return '';
      default: return '';
    }
  }

  function csvCell(value) {
    var s = String(value == null ? '' : value);
    if (/[",\n\r]/.test(s)) { return '"' + s.replace(/"/g, '""') + '"'; }
    return s;
  }

  function toCSV(orders, courierId, options) {
    var cols = columnsFor(courierId, options);
    var lines = [cols.map(function (col) { return csvCell(col.header); }).join(',')];
    orders.forEach(function (order) {
      lines.push(cols.map(function (col) { return csvCell(valueFor(order, col.key)); }).join(','));
    });
    return '\ufeff' + lines.join('\r\n') + '\r\n';
  }

  function toTSV(orders, courierId, options) {
    var cols = columnsFor(courierId, options);
    var lines = [cols.map(function (col) { return col.header; }).join('\t')];
    orders.forEach(function (order) {
      lines.push(cols.map(function (col) {
        return String(valueFor(order, col.key) || '').replace(/[\t\n\r]+/g, ' ');
      }).join('\t'));
    });
    return lines.join('\n');
  }

  return {
    parseOrders: parseOrders,
    parse: parseOrders,
    normalizePhone: normalizePhone,
    issuesFor: buildIssues,
    toCSV: toCSV,
    toTSV: toTSV,
    COURIERS: COURIERS,
    courierById: courierById,
    columnsFor: columnsFor
  };
});
