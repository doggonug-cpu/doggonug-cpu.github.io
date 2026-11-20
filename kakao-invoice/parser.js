/*!
 * 톡송장 3초 — 카톡 주문 텍스트 → 택배 송장 데이터 파서
 * 의존성 0개. 브라우저에서는 window.TalkInvoice, Node에서는 module.exports 로 씁니다.
 * 입력한 이름·전화·주소는 이 파일 안에서만 처리되며 어디로도 전송되지 않습니다.
 *
 * v2 — 실전 8대 현장 유형 + 9열 표준 스키마 + 적색/황색/녹색 검증 게이트
 *  1) 1인 다수 배송지 분리 & 수량 불일치 차단
 *  2) 말풍선 쪼개기 병합 (같은 발화자 · 5분 이내)
 *  3) 정정·취소 발화 감지
 *  4) 암묵적 참조(단골 생략) 추측 차단
 *  5) 비표준 표기·오타·동호수 보정 + 기본/상세주소 분리
 *  6) 닉네임 ≠ 입금자 ≠ 수취인 3필드 분리
 *  7) 도서산간·특수 배송 조건 태깅
 *  8) 이미지·손글씨 [사진] 감지
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.TalkInvoice = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ── 라벨 사전 ─────────────────────────────────────────────── */
  var LABEL_GROUPS = [
    ['postcode',  ['우편번호', '우편번호(5자리)', '우편']],
    ['address',   ['배송지주소', '배송주소', '받으실곳', '받으시는곳', '받는곳', '도착지', '주소지', '주소']],
    ['sender',    ['보내는분', '보내시는분', '보내는사람', '보낸사람', '발송인']],
    ['depositor', ['입금자명', '입금자', '송금자', '예금주', '주문자']],
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
  var MEMO_HINTS_RE = /(문[ \t]*앞|문앞|경비실|부재|배송[ \t]*전|전화[ \t]*(주|해|바|요)|놔[ \t]*주|놓아|맡겨|놓으|조심|파손|깨지|빠른[ \t]*배송|오전[ \t]*배송|오후[ \t]*배송|시간[ \t]*지정|요청|메모|비닐|봉투|박스에|포장|냉동|냉장|현관|비번|비밀번호|아이스팩|도착|금요일|토요일|일요일|주말|공동현관|택배함|무인택배)/;
  var DEPOSITOR_INLINE_RE = /^(?:입금(?:자|자명)?|송금자|예금주)[ \t]*[:：]?[ \t]*(\S.{0,20})$/;
  var SENDER_INLINE_RE = /(?:보내는[ \t]*(?:분|사람)|보내시는[ \t]*분|보낸[ \t]*사람|발송인)[ \t]*(?:은|는|이|가)?[ \t]*[:：]?[ \t]*([가-힣A-Za-z][가-힣A-Za-z0-9]{1,5})/;
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

  /* ── 주소 보정 (유형 5) ───────────────────────────────────── */
  // 105-802 → 105동 802호. 도로명 뒤 숫자(테헤란로 123-4)는 건드리지 않습니다.
  function expandUnitNumbers(value) {
    var s = String(value || '');
    if (!s || /[년월일]/.test(s)) { return s; }
    return s.replace(/(^|[\s(,])(\d{1,4})\s*[-~]\s*(\d{1,4})(?![\d-])/g, function (all, pre, a, b, offset) {
      var before = s.slice(Math.max(0, offset - 8), offset) + pre;
      if (/(?:로|길|대로|번길)[\s]*$/.test(before)) { return all; }
      return pre + a + '동 ' + b + '호';
    });
  }

  var DETAIL_TOKEN_SRC = '\\d{1,4}[ \\t]*(?:동|호|층|호수|호실|상가|층수)';
  var DETAIL_RE = new RegExp('(?:^|[\\s,])((?:' + DETAIL_TOKEN_SRC + ')(?:[\\s,]+' + DETAIL_TOKEN_SRC + ')*)');

  // 기본주소 / 상세주소(동·호·층·상가) 분리
  function splitAddress(addr) {
    var s = String(addr || '').trim();
    if (!s) { return { base: '', detail: '' }; }
    var expanded = expandUnitNumbers(s);
    var m = DETAIL_RE.exec(expanded);
    if (!m) { return { base: expanded, detail: '' }; }
    var start = m.index + m[0].indexOf(m[1]);
    var base = expanded.slice(0, start).replace(/[,\s]+$/, '').trim();
    var detail = expanded.slice(start).trim();
    if (!base) { return { base: '', detail: detail }; }
    return { base: base, detail: detail };
  }

  function fullAddress(order) {
    if (!order) { return ''; }
    var base = order.addrBase || '';
    var detail = order.addrDetail || '';
    if (base && detail) { return base + ' ' + detail; }
    return base || detail || order.address || '';
  }

  // 실제 주소인지: 번지·동·호 같은 숫자가 있거나, 지역 낱말이 들어 있어야 합니다.
  function looksLikeRealAddress(text) {
    var s = String(text || '').trim();
    if (!s) { return false; }
    if (/\d/.test(s)) { return true; }
    return s.replace(/\s/g, '').length >= 6 &&
      /(?:시|군|구|읍|면|동|리|로|길|아파트|빌라|오피스텔)/.test(s);
  }

  // 말버릇으로 끝나는 문장(인사·감사·잡담)인지
  var CHATTER_TAIL_RE = /(?:합니다|했습니다|입니다|하세요|주세요|네요|어요|아요|겠습니다|ㅋㅋ|ㅎㅎ|반가워|감사|고맙|수고)[\s.!~?]*$/;
  function isChatter(text) {
    var s = String(text || '').trim();
    if (!s || /\d/.test(s)) { return false; }
    if (looksLikeMemo(s)) { return false; }
    return CHATTER_TAIL_RE.test(s);
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

  /* ── 유형 6: 닉네임 감지 ──────────────────────────────────── */
  var NICK_PATTERNS = [
    /[\u2460-\u24FF\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF♥♡❤💕💖★☆]/,
    /(?:맘|마미|엄마|아빠|공주|왕자|천사|사랑|우리|님|총각|처자|언니|오빠|누나|형아|아가|베이비)$/,
    /ㅇㅇ|ㅁㅁ|ㅅㅅ|ㅎㅎ|ㅋㅋ/,
    /^[가-힣]{1,6}(?:맘|댁|네)$/
  ];

  function looksLikeNickname(name) {
    var n = String(name || '').replace(/\s/g, '');
    if (!n) { return false; }
    if (n.length > 8) { return true; }
    for (var i = 0; i < NICK_PATTERNS.length; i++) {
      if (NICK_PATTERNS[i].test(n)) { return true; }
    }
    return false;
  }

  /* ── 유형 7: 도서산간 ─────────────────────────────────────── */
  var ISLAND_RE = /(?:제주(?:시|도|특별자치도)?|서귀포|울릉|독도|백령|대청도|소청도|연평도|신안군|완도군|진도군|거제시|홍도|흑산도|추자도|마라도|보길도|청산도|노화도|금오도|사량도|욕지도|교동도|석모도|덕적도|영흥도|옹진군|강화군)/;

  /* ── 유형 3: 정정·취소 발화 ───────────────────────────────── */
  var CORRECTION_RE = /(변경|바꿀|바꿔|바꾸|교체|수정|정정|취소|대신|말고|잘못|아니고|틀렸)/;

  /* ── 유형 4: 단골(암묵적 참조) ────────────────────────────── */
  var REGULAR_RE = /(저번|지난번|지난[ \t]*주|작년|단골|또[ \t]*시킬|늘[ \t]*시키|같은[ \t]*주소|그때[ \t]*주소|아시죠|알죠|저예요|저야|저에요|또[ \t]*주문)/;

  /* ── 유형 8: 사진·손글씨 ──────────────────────────────────── */
  var PHOTO_RE = /(\[사진\]|사진[ \t]*(?:보냈|보내|첨부|올렸|찍어|으로)|캡처|스크린샷|이미지[ \t]*(?:첨부|전송)|손글씨|사진첩)/;

  /* ── 유형 1: 다중 배송지 ──────────────────────────────────── */
  var DEST_WORD_SRC = '우리집|우리[ \\t]*집|자택|본가|어머니|아버지|부모님|엄마|아빠|할머니|할아버지|장모|시어머니|시아버지|아내|와이프|남편|신랑|아들|딸|동생|누나|언니|오빠|이모|고모|삼촌|친구|회사|사무실|학교|군대|매장|가게|댁|집';
  var ALLOC_AFTER_RE = new RegExp('^[ \\t]*(?:는|은|를|을|이|가)?[ \\t]*(?:\\(|(?:' + DEST_WORD_SRC + '))');
  var DEST_WORD_RE = new RegExp('(?:' + DEST_WORD_SRC + ')(?:댁|집|네)?');

  /* ── 입력 정리 ────────────────────────────────────────────── */
  function normalizeText(raw) {
    var s = String(raw == null ? '' : raw);
    return s.replace(/\r\n?/g, '\n')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .replace(/\u00a0/g, ' ');
  }

  var DATE_LINE_RE = /^[ \t]*-{2,}[ \t]*\d{4}년[ \t]*\d{1,2}월[ \t]*\d{1,2}일[^\n]*-{2,}[ \t]*$/;
  var MOBILE_MSG_RE = /^[ \t]*\[([^\]\n]{1,40})\][ \t]*\[(?:오전|오후)?[ \t]*(\d{1,2}):(\d{2})\][ \t]?(.*)$/;
  var PC_MSG_RE = /^[ \t]*(\d{4})년[ \t]*(\d{1,2})월[ \t]*(\d{1,2})일[ \t]*(오전|오후)?[ \t]*(\d{1,2}):(\d{2})[ \t]*,[ \t]*([^:\n]{1,40}?)[ \t]*:[ \t]?(.*)$/;

  function minutesOf(ampm, hh, mm) {
    var h = Number(hh);
    var m = Number(mm);
    if (ampm === '오후' && h < 12) { h += 12; }
    if (ampm === '오전' && h === 12) { h = 0; }
    return h * 60 + m;
  }

  // 카톡 내보내기를 [발화자 · 시각] 메시지 목록으로 분해합니다.
  function extractMessages(text) {
    var lines = text.split('\n');
    var messages = [];
    var preamble = [];
    var current = null;
    var day = 0;
    var seen = 0;

    function flush() {
      if (current && current.text.trim()) {
        current.text = current.text.replace(/\s+$/, '');
        messages.push(current);
      }
      current = null;
    }

    lines.forEach(function (line) {
      if (DATE_LINE_RE.test(line)) { flush(); day += 1; return; }
      var m = MOBILE_MSG_RE.exec(line);
      if (m) {
        flush(); seen += 1;
        current = { speaker: m[1].trim(), minutes: minutesOf(null, m[2], m[3]), day: day, text: m[4] };
        return;
      }
      m = PC_MSG_RE.exec(line);
      if (m) {
        flush(); day = Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]); seen += 1;
        current = { speaker: m[7].trim(), minutes: minutesOf(m[4], m[5], m[6]), day: day, text: m[8] };
        return;
      }
      if (current) { current.text += '\n' + line; }
      else if (line.trim()) { preamble.push(line); }
    });
    flush();

    return { messages: messages, preamble: preamble.join('\n'), detected: seen > 0 };
  }

  function messageScore(text) {
    var score = 0;
    if (findPhone(text)) { score += 10; }
    if (looksLikeAddress(text)) { score += 8; }
    if (PRODUCT_QTY_TEST_RE.test(text)) { score += 4; }
    var labels = LABEL_LIST.filter(function (label) { return text.indexOf(label) !== -1; });
    score += labels.length * 3;
    score += Math.min(4, Math.floor(text.length / 40));
    return score;
  }

  // 유형 2: 같은 발화자의 5분 이내 말풍선을 한 세션으로 묶습니다.
  function buildSessions(messages) {
    var MAX_GAP = 5;
    var sessions = [];
    var cur = null;

    function push(msg) {
      if (!cur) { cur = { day: msg.day, messages: [] }; sessions.push(cur); }
      cur.messages.push(msg);
    }

    messages.forEach(function (msg) {
      var prev = cur && cur.messages.length ? cur.messages[cur.messages.length - 1] : null;
      if (!prev) { push(msg); return; }
      var gap = msg.minutes - prev.minutes;
      if (msg.day !== cur.day || gap > MAX_GAP) {
        cur = null;
        push(msg);
      } else {
        push(msg);
      }
    });

    return sessions.map(function (session) {
      var bySpeaker = {};
      session.messages.forEach(function (msg) {
        var key = msg.speaker;
        if (!bySpeaker[key]) { bySpeaker[key] = { speaker: key, texts: [], score: 0, chars: 0 }; }
        bySpeaker[key].texts.push(msg.text);
        bySpeaker[key].score += messageScore(msg.text);
        bySpeaker[key].chars += msg.text.length;
      });
      var list = Object.keys(bySpeaker).map(function (k) { return bySpeaker[k]; });
      var primary = null;
      list.forEach(function (entry) {
        if (/^(?:나|me|본인)$/i.test(entry.speaker)) { return; }
        if (!primary || entry.score > primary.score) { primary = entry; }
      });
      if (!primary) { primary = list[0]; }

      var primaryText = primary.texts.join('\n');
      var others = list.filter(function (entry) { return entry !== primary; });
      // 다른 사람(사장님) 말풍선은 연락처·주소가 들어 있을 때만 보탭니다.
      others.forEach(function (entry) {
        entry.texts.forEach(function (text) {
          if (findPhone(text) || looksLikeAddress(text)) { primaryText += '\n' + text; }
        });
      });
      if (!findPhone(primaryText) && !looksLikeAddress(primaryText)) {
        primaryText = session.messages.map(function (msg) { return msg.text; }).join('\n');
      }
      return { text: primaryText, speaker: primary.speaker, explicit: true };
    }).filter(function (session) { return session.text.trim(); });
  }

  function cleanInput(raw) {
    var s = normalizeText(raw);
    // 카톡 내보내기 날짜 구분선 / 대시 구분선 → 주문 경계
    s = s.replace(/^[ \t]*[-=ㅡ_]{3,}[^\n]*$/gm, '\n\n');
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

  /* ── 주문 1건 ─────────────────────────────────────────────── */
  function blankOrder() {
    return {
      name: '', phone: '', phoneRaw: '', postcode: '',
      address: '', addrBase: '', addrDetail: '',
      product: '', qty: '', memo: '', depositor: '', sender: '',
      flags: [], flagNotes: {}, raw: '',
      issues: [], gate: 'green', reviewOnly: false,
      _touched: false, _fromLabel: {}
    };
  }

  function addFlag(order, label, note) {
    if (order.flags.indexOf(label) === -1) { order.flags.push(label); }
    if (note) { order.flagNotes[label] = note; }
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

  function assignFreeText(text, order, afterPhone) {
    // 목록 기호만 걷어냅니다. 현관비번 '#1234*' 의 별표는 값의 일부라 남깁니다.
    var t = String(text || '').replace(/^[-–—,·•*]+[ \t]*/, '').replace(/[ \t]+[-–—,·•]+$/, '').trim();
    if (!t) { return; }

    var sender = t.match(SENDER_INLINE_RE);
    if (sender && !order.sender) {
      order.sender = sender[1].trim();
      order._touched = true;
      return;
    }

    // 유형 4: "저번 주소로", "단골" 같은 말은 주소로 읽지 않고 이름·수량만 건집니다.
    var digits = (t.match(/\d/g) || []).length;
    var regularTalk = REGULAR_RE.test(t) && !findPhone(t) && digits <= 2 &&
      !/\d+[ \t]*(?:동|호|층)/.test(t);
    if (regularTalk) {
      var nick = t.match(/(?:저|제가|저는|전)[ \t]*([가-힣]{2,5})[ \t]*(?:예요|이에요|입니다|이야|야)/);
      if (nick && !order.name) { order.name = nick[1]; }
      var onlyQty = t.match(new RegExp('(\\d+)[ \\t]*(' + COUNT_UNITS + ')'));
      if (onlyQty && !order.qty) { order.qty = onlyQty[1] + onlyQty[2]; }
      order._touched = true;
      return;
    }

    var inlineDepositor = t.match(DEPOSITOR_INLINE_RE);
    if (inlineDepositor && !order.depositor) {
      order.depositor = inlineDepositor[1].replace(/[ \t]*(?:입니다|이요|이에요|요)$/, '').trim();
      order._touched = true;
      return;
    }

    // 배송메모 신호(문 앞·경비실·현관비번 등)는 약한 주소 단서보다 우선합니다.
    if (looksLikeMemo(t) && !STRONG_ADDRESS_RE.test(t)) {
      order.memo = joinPart(order.memo, t, ' / ');
      order._touched = true;
      return;
    }
    // 인사·감사·잡담 문장은 이름·주소·상품으로 만들지 않습니다.
    if (isChatter(t)) { return; }
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
      case 'postcode':
        order.postcode = value.replace(/[^0-9]/g, '').slice(0, 5) || value;
        break;
      case 'sender':
        if (!order.sender) { order.sender = value; }
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

  /* ── 유형 3: 정정 발화 분리 ───────────────────────────────── */
  function detectCorrections(text) {
    var out = { found: false, cancel: false, qty: '', address: '', phone: '', name: '', sentences: [], cleaned: text };
    var lines = String(text || '').split('\n');
    var keep = [];
    lines.forEach(function (line) {
      if (!CORRECTION_RE.test(line)) { keep.push(line); return; }
      out.found = true;
      if (/취소/.test(line)) { out.cancel = true; }
      out.sentences.push(line.trim());
      var qm = line.match(/(\d+)[ \t]*(개|박스|세트|팩|봉지|봉|병|장|매|포|줄|켤레|쌍|송이|단|근|마리|대|권)/);
      if (qm) { out.qty = qm[1] + qm[2]; }
      var ph = findPhone(line);
      if (ph) { out.phone = normalizePhone(ph.raw).value || ph.raw; }
      var paren = line.match(/\(([^)]{4,})\)/);
      if (paren && looksLikeAddress(paren[1])) { out.address = paren[1].trim(); }
      var nm = line.match(/(?:받는[ \t]*(?:분|사람)|수취인|이름)[ \t]*(?:은|는|이|가)?[ \t]*([가-힣]{2,5})/);
      if (nm) { out.name = nm[1]; }
    });
    out.cleaned = keep.join('\n');
    return out;
  }

  /* ── 유형 1: 다중 배송지 분리 ─────────────────────────────── */
  function splitSegment(segmentText) {
    var seg = String(segmentText || '').trim();
    var out = { name: '', phone: '', address: '', destLabel: '' };
    var destMatch = seg.match(DEST_WORD_RE);
    if (destMatch) { out.destLabel = destMatch[0]; }

    var paren = seg.match(/\(([^)]{2,})\)/);
    var inner = paren ? paren[1] : seg.replace(new RegExp('^[ \\t]*(?:는|은|를|을)?[ \\t]*(?:' + DEST_WORD_SRC + ')?[ \\t]*'), '');
    inner = inner.replace(/[ \t]*(?:보내주세요|보내줘|보내세요|보내|주세요|부탁드려요|부탁해요|입니다|이에요|예요|요)[ \t.]*$/, '').trim();
    inner = inner.replace(/^[-–—,·•*()\s]+|[-–—,·•*()\s]+$/g, '').trim();

    var phone = findPhone(inner);
    if (phone) {
      out.phone = normalizePhone(phone.raw).value || phone.raw;
      var before = inner.slice(0, phone.start);
      var after = inner.slice(phone.end);
      var nm = before.match(/([가-힣A-Za-z][가-힣A-Za-z0-9]{0,7})[ \t]*$/);
      if (nm) {
        out.name = nm[1];
        inner = before.slice(0, before.length - nm[0].length) + ' ' + after;
      } else {
        inner = before + ' ' + after;
      }
    }
    out.address = inner.replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim();
    return out;
  }

  function parseMultiDestination(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length > 400) { return null; }
    var tokens = [];
    var re = new RegExp('(\\d+)[ \\t]*(' + COUNT_UNITS + ')', 'g');
    var m;
    while ((m = re.exec(t))) {
      tokens.push({ index: m.index, end: m.index + m[0].length, num: Number(m[1]), qty: m[1] + m[2] });
    }
    if (tokens.length < 2) { return null; }

    var allocs = tokens.filter(function (tok) {
      return ALLOC_AFTER_RE.test(t.slice(tok.end, tok.end + 16));
    });
    if (allocs.length < 2) { return null; }

    var head = t.slice(0, allocs[0].index)
      .replace(/(?:요|입니다|이에요|예요|주세요|보내주세요|보내줘)[ \t.,]*$/, '')
      .replace(/[ \t.,]+$/, '')
      .trim();

    // 총 수량: 첫 분배 표기 앞에 있는 수량
    var total = null;
    tokens.forEach(function (tok) {
      if (tok.index < allocs[0].index) { total = tok; }
    });

    var orders = [];
    var sum = 0;
    allocs.forEach(function (alloc, i) {
      var segEnd = i + 1 < allocs.length ? allocs[i + 1].index : t.length;
      var seg = splitSegment(t.slice(alloc.end, segEnd));
      sum += alloc.num;
      var order = blankOrder();
      order._touched = true;
      order.name = seg.name;
      order.phone = seg.phone;
      order.address = seg.address;
      if (seg.destLabel) { order.memo = '배송처: ' + seg.destLabel; }
      if (head) { addProduct(order, head); }
      order.qty = alloc.qty;
      orders.push(order);
    });

    var senderMatch = t.match(SENDER_INLINE_RE);
    var sender = senderMatch ? senderMatch[1].trim() : '';

    var mismatch = !!(total && total.num !== sum);
    orders.forEach(function (order) {
      if (sender) { order.sender = sender; }
      if (mismatch) {
        addFlag(order, '수량불일치', '총 ' + total.num + '개인데 나눈 합은 ' + sum + '개입니다');
      }
      addFlag(order, '다중배송지', '한 주문을 ' + orders.length + '곳으로 나눠 받았습니다');
    });

    return orders;
  }

  /* ── 주문 블록 파싱 ───────────────────────────────────────── */
  function parseBlock(rawBlock) {
    var corr = detectCorrections(rawBlock);
    var text = corr.cleaned.replace(LABEL_COMMA_RE, '\n');
    if (!text.trim() && !corr.found) { return []; }
    var lines = text.split('\n');
    var orders = [];
    var order = blankOrder();

    function flush() {
      if (order._touched) { orders.push(validate(order, corr, rawBlock)); }
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

    // 정정 발화만 있는 블록도 확인 대상으로 남깁니다.
    if (!orders.length && corr.found) {
      var only = blankOrder();
      only._touched = true;
      only.reviewOnly = true;
      orders.push(validate(only, corr, rawBlock));
    }

    return orders;
  }

  /* ── 검증 ─────────────────────────────────────────────────── */
  var DERIVED_FLAGS = ['닉네임주의', '도서산간 +추가운임'];

  function deriveFlags(order) {
    order.flags = (order.flags || []).filter(function (flag) {
      return DERIVED_FLAGS.indexOf(flag) === -1;
    });
    if (order.name && looksLikeNickname(order.name)) {
      addFlag(order, '닉네임주의', '수취인명이 닉네임으로 보입니다: ' + order.name);
    }
    var addr = fullAddress(order);
    if (addr && ISLAND_RE.test(addr)) {
      addFlag(order, '도서산간 +추가운임', '도서산간 지역으로 보입니다 — 추가 운임을 확인하세요');
    }
  }

  function buildIssues(order) {
    var issues = [];
    var flags = order.flags || [];

    if (order.reviewOnly) {
      // 정정·취소만 있는 발화: 빈 칸을 오류로 만들지 않고 확인 대상(황색)으로만 남깁니다.
      if (flags.indexOf('취소발화') !== -1) {
        issues.push({ field: 'raw', level: 'warn', message: '취소 발화가 포함되어 있습니다 — 발송 전에 확인하세요' });
      }
      if (flags.indexOf('정정발화') !== -1) {
        issues.push({ field: 'raw', level: 'warn', message: '정정·취소 발화가 있습니다 — 원문을 확인하세요' });
      }
      return issues;
    }

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
    var addr = fullAddress(order);
    if (!addr) {
      issues.push({ field: 'address', level: 'error', message: '주소가 없습니다' });
    } else if (addr.replace(/\s/g, '').length < 6) {
      issues.push({ field: 'address', level: 'warn', message: '주소가 짧습니다 — 상세주소를 확인하세요' });
    }
    if (!order.product) {
      issues.push({ field: 'product', level: 'warn', message: '상품명이 없습니다' });
    }
    if (order.memo && order.memo.length > 50) {
      issues.push({
        field: 'memo', level: 'warn',
        message: '배송메시지가 50자를 넘습니다 (' + order.memo.length + '자, 초과 ' + (order.memo.length - 50) + '자)'
      });
    }

    if (flags.indexOf('수량불일치') !== -1) {
      issues.push({ field: 'qty', level: 'error', message: order.flagNotes['수량불일치'] || '수량이 맞지 않습니다' });
    }
    if (flags.indexOf('사진확인필요') !== -1) {
      var incomplete = !order.phone || !fullAddress(order);
      issues.push({
        field: 'raw', level: incomplete ? 'error' : 'warn',
        message: incomplete
          ? '사진으로 온 주문입니다 — 사진을 열어 내용을 직접 입력하세요'
          : '사진이 함께 왔습니다 — 내용을 대조하세요'
      });
    }
    if (flags.indexOf('단골확인필요') !== -1) {
      issues.push({ field: 'address', level: 'error', message: '지난 주문을 가리키는 표현만 있습니다 — 주소·연락처를 직접 확인하세요' });
    }
    if (flags.indexOf('정정발화') !== -1) {
      issues.push({ field: 'raw', level: 'warn', message: '정정·취소 발화가 있습니다 — 원문을 확인하세요' });
    }
    if (flags.indexOf('취소발화') !== -1) {
      issues.push({ field: 'raw', level: 'warn', message: '취소 발화가 포함되어 있습니다 — 발송 전에 확인하세요' });
    }
    if (flags.indexOf('닉네임주의') !== -1) {
      issues.push({ field: 'name', level: 'warn', message: order.flagNotes['닉네임주의'] || '닉네임으로 보이는 이름입니다' });
    }
    if (flags.indexOf('중복의심') !== -1) {
      issues.push({ field: 'name', level: 'warn', message: order.flagNotes['중복의심'] || '같은 주문이 2건 이상입니다' });
    }
    return issues;
  }

  function gateOf(order) {
    var issues = order.issues || [];
    var level = 'green';
    issues.forEach(function (issue) {
      if (issue.level === 'error') { level = 'red'; }
      else if (level !== 'red') { level = 'yellow'; }
    });
    return level;
  }

  function validate(order, corr, rawBlock) {
    if (order.phone) { order.phone = normalizePhone(order.phone).value; }

    if (corr && corr.found) {
      if (corr.qty) { order.qty = corr.qty; }
      if (corr.phone) { order.phone = corr.phone; }
      if (corr.name) { order.name = corr.name; }
      if (corr.address) { order.address = corr.address; }
      addFlag(order, '정정발화', '정정 발화: ' + corr.sentences.join(' / '));
      if (corr.cancel) { addFlag(order, '취소발화'); }
    }

    var addr = String(order.address || '').trim();
    if (addr) {
      var parts = splitAddress(addr);
      order.addrBase = parts.base;
      order.addrDetail = parts.detail;
      order.address = (parts.base + (parts.detail ? ' ' + parts.detail : '')).trim();
    }
    if (!order.postcode) {
      var pm = String(order.address || '').match(/^\(\s*(\d{5})\s*\)\s*/);
      if (pm) {
        order.postcode = pm[1];
        order.address = order.address.replace(pm[0], '').trim();
        var again = splitAddress(order.address);
        order.addrBase = again.base;
        order.addrDetail = again.detail;
      }
    }

    if (rawBlock) {
      var raw = String(rawBlock).trim();
      order.raw = raw.length > 400 ? raw.slice(0, 400) + '…' : raw;
    }

    deriveFlags(order);
    order.issues = buildIssues(order);
    order.gate = gateOf(order);

    delete order._touched;
    delete order._fromLabel;
    delete order.phoneRaw;
    return order;
  }

  // 유형 4: 지난 주문을 가리키는 발화
  function markRegular(order, text) {
    if (!REGULAR_RE.test(text)) { return; }
    if (!order.address || !order.phone) { addFlag(order, '단골확인필요'); }
  }

  // 유형 8: 사진 주문
  function markPhoto(order, text) {
    if (!PHOTO_RE.test(text)) { return; }
    addFlag(order, '사진확인필요', '사진·캡처가 함께 온 주문입니다');
  }

  /* ── 중복 의심 ────────────────────────────────────────────── */
  function hashOf(order) {
    var digits = String(order.phone || '').replace(/[^0-9]/g, '');
    var addr = String(fullAddress(order) || '').replace(/[^0-9가-힣]/g, '');
    var name = String(order.name || '').replace(/\s/g, '');
    var product = String(order.product || '').replace(/\s/g, '');
    return [name, digits, addr, product].join('|');
  }

  function markDuplicates(orders) {
    var buckets = {};
    orders.forEach(function (order) {
      if (!order.phone && !fullAddress(order)) { return; }
      var key = hashOf(order);
      if (!buckets[key]) { buckets[key] = []; }
      buckets[key].push(order);
    });
    var duplicated = {};
    Object.keys(buckets).forEach(function (key) {
      if (buckets[key].length > 1) { duplicated[key] = buckets[key].length; }
    });
    orders.forEach(function (order) {
      order.flags = (order.flags || []).filter(function (flag) { return flag !== '중복의심'; });
      var key = hashOf(order);
      if (duplicated[key] && (!order.phone && !fullAddress(order) ? false : true)) {
        addFlag(order, '중복의심', '같은 받는분·연락처·주소·품목 주문이 ' + duplicated[key] + '건입니다');
      }
      order.issues = buildIssues(order);
      order.gate = gateOf(order);
    });
    return orders;
  }

  /* ── 전체 파싱 ────────────────────────────────────────────── */
  function parseOrders(raw) {
    var text = cleanInput(raw);
    if (!text.trim()) { return []; }

    var extracted = extractMessages(text);
    var blocks = [];

    if (extracted.detected) {
      // 유형 2: 말풍선 병합 세션 단위로 파싱
      buildSessions(extracted.messages).forEach(function (session) {
        blocks.push({ text: session.text, explicit: true });
      });
      if (extracted.preamble.trim()) {
        blocks.push({ text: extracted.preamble.trim(), explicit: true });
      }
    } else {
      var paragraphs = text.split(/\n[ \t]*\n+/);
      paragraphs.forEach(function (paragraph) {
        var parts = splitNumbered(paragraph);
        var explicit = parts.length > 1;
        parts.forEach(function (block) {
          var trimmed = block.trim();
          if (trimmed) { blocks.push({ text: trimmed, explicit: explicit }); }
        });
      });
      blocks = mergeContinuations(blocks);
    }

    var orders = [];
    blocks.forEach(function (block) {
      var multi = parseMultiDestination(block.text);
      if (multi) {
        multi.forEach(function (order) {
          validate(order, null, block.text);
          markPhoto(order, block.text);
          markRegular(order, block.text);
          if (CORRECTION_RE.test(block.text)) {
            addFlag(order, '정정발화', '정정·취소 표현이 섞인 주문입니다');
            if (/취소/.test(block.text)) { addFlag(order, '취소발화'); }
          }
          orders.push(order);
        });
        return;
      }

      var parsed = parseBlock(block.text);
      var hasPhoto = PHOTO_RE.test(block.text);
      var kept = 0;

      if (hasPhoto && !findPhone(block.text) && !STRONG_ADDRESS_RE.test(block.text)) {
        // 유형 8: 사진·캡처만 온 주문은 본문을 짐작하지 않고 적색 확인 행으로 남깁니다.
        var shot = blankOrder();
        shot.raw = String(block.text).trim().slice(0, 400);
        shot.flags.push('사진확인필요');
        shot.issues = buildIssues(shot);
        shot.gate = gateOf(shot);
        orders.push(shot);
        return;
      }

      parsed.forEach(function (order) {
        markPhoto(order, block.text);
        markRegular(order, block.text);
        // 인사·잡담처럼 사장 정보가 거의 없는 덩어리는 주문으로 만들지 않습니다.
        // (연락처·주소가 있거나, 이름과 상품이 함께 있어야 한 건으로 봅니다.)
        var meaningful = order.reviewOnly ||
          (order.flags || []).some(function (flag) { return flag === '사진확인필요' || flag === '단골확인필요'; }) ||
          order.phone || looksLikeRealAddress(fullAddress(order)) || (order.name && order.product);
        if (!meaningful) { return; }
        kept += 1;
        if (hasPhoto) {
          order.issues = buildIssues(order);
          order.gate = gateOf(order);
        }
        orders.push(order);
      });

      if (!kept && hasPhoto) {
        // 유형 8: 사진만 온 주문도 빠뜨리지 않고 적색 확인 행으로 남깁니다.
        var photo = blankOrder();
        photo.raw = String(block.text).trim().slice(0, 400);
        photo.flags.push('사진확인필요');
        photo.issues = buildIssues(photo);
        photo.gate = gateOf(photo);
        orders.push(photo);
      }
    });

    markDuplicates(orders);
    return orders;
  }

  /* ── 택배사 양식 ──────────────────────────────────────────── */
  var COURIERS = [
    {
      id: 'standard9',
      label: '표준 9열 (감열식 4B-2054N)',
      note: '수취인명 · 연락처 · 우편번호 · 기본주소 · 상세주소 · 품목명 · 수량 · 배송메시지 · 특수플래그',
      recommended: true,
      columns: [
        { header: '수취인명', key: 'name' },
        { header: '연락처', key: 'phone' },
        { header: '우편번호', key: 'postcode' },
        { header: '기본주소', key: 'addrBase' },
        { header: '상세주소', key: 'addrDetail' },
        { header: '품목명', key: 'product' },
        { header: '수량', key: 'qty' },
        { header: '배송메시지', key: 'memo' },
        { header: '특수플래그', key: 'flags' }
      ]
    },
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
    if (options && options.includeSender && courier.id !== 'smartstore') {
      cols.push({ header: '발송인', key: 'sender' });
    }
    return cols;
  }

  function flagText(order) {
    return (order.flags || []).map(function (flag) { return '[' + flag + ']'; }).join(' ');
  }

  function valueFor(order, key) {
    switch (key) {
      case 'name': return order.name || '';
      case 'phone': return order.phone || '';
      case 'postcode': return order.postcode || '';
      case 'addrBase': return order.addrBase || '';
      case 'addrDetail': return order.addrDetail || '';
      case 'address': return fullAddress(order);
      case 'product': return order.product || '';
      case 'qty': return order.qty || '';
      case 'memo': return order.memo || '';
      case 'depositor': return order.depositor || '';
      case 'sender': return order.sender || '';
      case 'flags': return flagText(order);
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

  /* ── 편집 후 재검사 ───────────────────────────────────────── */
  function refreshOrder(order) {
    if (order.addrBase || order.addrDetail) {
      order.address = (order.addrBase + (order.addrDetail ? ' ' + order.addrDetail : '')).trim();
    } else if (order.address) {
      var parts = splitAddress(order.address);
      order.addrBase = parts.base;
      order.addrDetail = parts.detail;
    }
    deriveFlags(order);
    order.issues = buildIssues(order);
    order.gate = gateOf(order);
    return order;
  }

  return {
    parseOrders: parseOrders,
    parse: parseOrders,
    normalizePhone: normalizePhone,
    issuesFor: buildIssues,
    refreshOrder: refreshOrder,
    markDuplicates: markDuplicates,
    splitAddress: splitAddress,
    fullAddress: fullAddress,
    looksLikeRealAddress: looksLikeRealAddress,
    looksLikeNickname: looksLikeNickname,
    toCSV: toCSV,
    toTSV: toTSV,
    flagText: flagText,
    COURIERS: COURIERS,
    courierById: courierById,
    columnsFor: columnsFor
  };
});
