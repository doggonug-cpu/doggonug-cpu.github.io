/* 톡송장 3초 — parser.js 단위 테스트 (브라우저에서 runner.html 로 실행) */
(function () {
  'use strict';

  var T = window.TalkInvoice;
  var results = [];
  var log = document.getElementById('log');

  function record(name, pass, detail) {
    results.push({ name: name, pass: pass, detail: detail || '' });
    var li = document.createElement('li');
    li.className = pass ? 'pass' : 'fail';
    li.textContent = (pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' — ' + detail);
    if (log) { log.appendChild(li); }
  }

  function eq(actual, expected, name) {
    var pass = actual === expected;
    record(name, pass, pass ? '' : '기대 ' + JSON.stringify(expected) + ' / 실제 ' + JSON.stringify(actual));
  }

  function ok(cond, name, detail) { record(name, !!cond, detail || ''); }

  function order(i, text) { return T.parseOrders(text)[i || 0] || {}; }

  function headerOf(csv) { return csv.split('\r\n')[0].replace(/^\ufeff/, ''); }

  /* ── 1. 라벨형 ─────────────────────────────────────────── */
  var labeled = [
    '이름: 김철수',
    '전화: 010-1234-5678',
    '주소: 서울시 강남구 테헤란로 123 4층',
    '상품: 사과 5kg',
    '수량: 2박스',
    '배송메모: 문 앞에 놔주세요',
    '입금자: 김철수'
  ].join('\n');

  var o1 = order(0, labeled);
  eq(o1.name, '김철수', '라벨형: 받는분');
  eq(o1.phone, '010-1234-5678', '라벨형: 연락처');
  eq(o1.address, '서울시 강남구 테헤란로 123 4층', '라벨형: 주소');
  eq(o1.product, '사과 5kg', '라벨형: 상품명');
  eq(o1.qty, '2박스', '라벨형: 수량');
  eq(o1.memo, '문 앞에 놔주세요', '라벨형: 배송메모');
  eq(o1.depositor, '김철수', '라벨형: 입금자명');
  eq(o1.issues.length, 0, '라벨형: 경고 없음');

  /* ── 2. 자유형 한 줄 ───────────────────────────────────── */
  var o2 = order(0, '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 5kg 2박스');
  eq(o2.name, '김철수', '자유형: 받는분');
  eq(o2.phone, '010-1234-5678', '자유형: 연락처');
  eq(o2.address, '서울시 강남구 테헤란로 123', '자유형: 주소');
  eq(o2.product, '사과 5kg', '자유형: 상품명');
  eq(o2.qty, '2박스', '자유형: 수량');

  /* ── 3. 다건: 번호 구분 ────────────────────────────────── */
  var numbered = '1. 김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 5kg 2박스\n' +
                 '2. 이영희 010-2222-3333 부산시 해운대구 센텀중앙로 79 / 배 3kg 1박스\n' +
                 '3. 박민수 010-4444-5555 대구시 수성구 동대구로 100 / 감 2kg 4박스';
  var n3 = T.parseOrders(numbered);
  eq(n3.length, 3, '다건(번호): 3건 분리');
  eq(n3[1] && n3[1].name, '이영희', '다건(번호): 2번째 이름');
  eq(n3[2] && n3[2].qty, '4박스', '다건(번호): 3번째 수량');

  /* ── 4. 다건: 빈 줄 구분 ───────────────────────────────── */
  var blank = '이름: 김철수\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123\n\n' +
              '이름: 이영희\n전화: 010-2222-3333\n주소: 부산시 해운대구 센텀중앙로 79';
  var b2 = T.parseOrders(blank);
  eq(b2.length, 2, '다건(빈 줄): 2건 분리');

  /* ── 5. 빈 줄이 한 주문 안에 있는 경우 ────────────────── */
  var innerBlank = '이름: 김철수\n\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123';
  var ib = T.parseOrders(innerBlank);
  eq(ib.length, 1, '한 주문 안의 빈 줄은 합침');
  eq(ib[0] && ib[0].phone, '010-1234-5678', '한 주문 안 빈 줄: 연락처');

  /* ── 6. 카톡 내보내기 헤더 무시 ────────────────────────── */
  var kakaotalk = '[김미숙] [오전 9:12] 이름: 박정희\n' +
                  '[김미숙] [오전 9:12] 연락처: 010-2345-6789\n' +
                  '[김미숙] [오전 9:13] 주소: 전남 완도군 완도읍 장보고대로 123 3층\n' +
                  '[김미숙] [오전 9:13] 상품: 완도 활전복 1kg 2박스';
  var kk = T.parseOrders(kakaotalk);
  eq(kk.length, 1, '카톡 모바일 헤더: 1건');
  eq(kk[0] && kk[0].name, '박정희', '카톡 모바일 헤더: 보낸사람이 아니라 받는분');
  eq(kk[0] && kk[0].product, '완도 활전복 1kg', '카톡 헤더: 상품명');
  eq(kk[0] && kk[0].qty, '2박스', '카톡 헤더: 수량');

  var pcExport = '2024년 5월 12일 오후 3:12, 김미숙 : 이름: 박정희\n' +
                 '2024년 5월 12일 오후 3:12, 김미숙 : 연락처: 010-2345-6789\n' +
                 '2024년 5월 12일 오후 3:13, 김미숙 : 주소: 전남 완도군 완도읍 장보고대로 123';
  var pc = T.parseOrders(pcExport);
  eq(pc.length, 1, '카톡 PC 헤더: 1건');
  eq(pc[0] && pc[0].name, '박정희', '카톡 PC 헤더: 이름');

  var withDivider = '--------------- 2024년 5월 12일 일요일 ---------------\n' +
                    '김철수 010-1234-5678 서울시 강남구 테헤란로 123\n' +
                    '--------------- 2024년 5월 12일 일요일 ---------------\n' +
                    '이영희 010-2222-3333 부산시 해운대구 센텀중앙로 79';
  eq(T.parseOrders(withDivider).length, 2, '카톡 날짜 구분선: 2건 분리');

  /* ── 7. 연락처 정규화 ──────────────────────────────────── */
  eq(T.normalizePhone('010 1234 5678').value, '010-1234-5678', '정규화: 공백');
  eq(T.normalizePhone('01012345678').value, '010-1234-5678', '정규화: 하이픈 없음');
  eq(T.normalizePhone('+82 10-1234-5678').value, '010-1234-5678', '정규화: +82');
  eq(T.normalizePhone('02-123-4567').value, '02-123-4567', '정규화: 서울 지역번호');
  eq(T.normalizePhone('010-1234-5678').valid, true, '정규화: 정상 11자리');
  eq(T.normalizePhone('010-123-4567').valid, false, '정규화: 010 10자리는 오류');

  /* ── 8. 오류·누락 감지 ─────────────────────────────────── */
  var badPhone = order(0, '이름: 김철수\n전화: 010-5555-66\n주소: 서울시 강남구 테헤란로 123');
  ok(badPhone.issues.some(function (i) { return i.field === 'phone' && i.level === 'error'; }),
    '오류 감지: 연락처 자릿수');

  var noAddress = order(0, '이름: 김철수\n전화: 010-1234-5678');
  ok(noAddress.issues.some(function (i) { return i.field === 'address' && i.level === 'error'; }),
    '오류 감지: 주소 누락');

  var noName = order(0, '전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123');
  ok(noName.issues.some(function (i) { return i.field === 'name' && i.level === 'warn'; }),
    '오류 감지: 이름 누락(경고)');

  /* ── 9. 라벨 공백형 · 쉼표 연결 ────────────────────────── */
  var spaceForm = order(0, '이름 김철수 / 연락처 010-1234-5678 / 주소 서울시 마포구 월드컵로 10');
  eq(spaceForm.name, '김철수', '라벨 공백형: 이름');
  eq(spaceForm.phone, '010-1234-5678', '라벨 공백형: 연락처');

  var commaInline = order(0, '이름: 김철수, 전화: 010-1234-5678, 주소: 서울시 강남구 테헤란로 123');
  eq(commaInline.name, '김철수', '쉼표로 붙은 라벨: 이름');
  eq(commaInline.address, '서울시 강남구 테헤란로 123', '쉼표로 붙은 라벨: 주소');

  /* ── 10. 수량 분리 ─────────────────────────────────────── */
  var q1 = order(0, '이름: 김철수\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123\n상품: 니트 3장');
  eq(q1.product, '니트', '수량 분리: 상품명');
  eq(q1.qty, '3장', '수량 분리: 수량');

  var q2 = order(0, '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 완도 활전복 1kg 2박스');
  eq(q2.product, '완도 활전복 1kg', '수량 분리: 중간 단위 포함 상품명');
  eq(q2.qty, '2박스', '수량 분리: 마지막 수량');

  /* ── 11. 배송메모 · 입금자 자유형 ──────────────────────── */
  var memoFree = order(0, '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 경비실에 맡겨주세요 / 입금 김철수');
  eq(memoFree.memo, '경비실에 맡겨주세요', '자유형: 배송메모');
  eq(memoFree.depositor, '김철수', '자유형: 입금자');

  /* ── 12. CSV: BOM·헤더 순서·이스케이프 ─────────────────── */
  var orders = T.parseOrders('이름: 김철수\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123, 4층\n상품: 사과 5kg\n수량: 2박스\n입금자: 김철수');

  var csv = T.toCSV(orders, 'cj');
  eq(csv.charCodeAt(0), 0xFEFF, 'CSV: UTF-8 BOM');
  eq(headerOf(csv), '받는분성명,받는분전화번호,받는분주소,상품명,수량,배송메세지,운송장번호', 'CSV: CJ 헤더 순서');
  ok(csv.indexOf('"서울시 강남구 테헤란로 123, 4층"') !== -1, 'CSV: 쉼표 포함 셀 따옴표 처리');

  eq(headerOf(T.toCSV(orders, 'rosen')), '수취인명,수취인전화번호,수취인주소,상품명,수량,배송메모,운송장번호', 'CSV: 로젠 헤더');
  eq(headerOf(T.toCSV(orders, 'hanjin')), '받는분,전화번호,주소,상품명,수량,배송메시지,운송장번호', 'CSV: 한진 헤더');
  eq(headerOf(T.toCSV(orders, 'lotte')), '수취인,전화번호,주소,품명,수량,배송메시지,운송장번호', 'CSV: 롯데 헤더');
  eq(headerOf(T.toCSV(orders, 'post')), '수취인성명,전화번호,주소,품명,수량,배송메시지,등기번호', 'CSV: 우체국 헤더');
  eq(headerOf(T.toCSV(orders, 'smartstore')), '상품주문번호,배송방법,택배사,송장번호', 'CSV: 스마트스토어 헤더');
  eq(headerOf(T.toCSV(orders, 'cj', { includeDepositor: true })).split(',').pop(), '입금자명', 'CSV: 입금자명 열 옵션');

  var csvLines = csv.split('\r\n');
  eq(csvLines.length, 3, 'CSV: 헤더 1줄 + 주문 1줄 + 끝줄바꿈');
  ok(csvLines[1].indexOf('김철수,010-1234-5678') === 0, 'CSV: 데이터 행 시작');

  /* ── 13. TSV (엑셀 붙여넣기) ───────────────────────────── */
  var tsv = T.toTSV(orders, 'hanjin');
  eq(tsv.split('\n')[0], '받는분\t전화번호\t주소\t상품명\t수량\t배송메시지\t운송장번호', 'TSV: 헤더');
  ok(tsv.split('\n')[1].indexOf('김철수\t010-1234-5678') === 0, 'TSV: 데이터 행');

  /* ── 14. 전체 샘플 회귀 ────────────────────────────────── */
  var sample3 = '1) 받는분: 김영희\n전화번호: 010-1111-2222\n주소: 부산시 해운대구 센텀중앙로 79 5층\n상품명: 한우 선물세트 1호\n수량: 1박스\n\n' +
                '2) 받는분: 이철수\n전화번호: 010-3333-4444\n주소: 대구시 수성구 동대구로 100\n상품명: 한우 선물세트 1호\n수량: 2박스\n\n' +
                '3) 받는분: 박영수\n전화번호: 010-5555-66\n주소: 광주시 서구 상무중앙로 58\n상품명: 한우 선물세트 1호';
  var s3 = T.parseOrders(sample3);
  eq(s3.length, 3, '샘플 3종: 3건');
  eq(s3[0].name, '김영희', '샘플 3종: 1번째');
  eq(s3[1].qty, '2박스', '샘플 3종: 2번째 수량');
  ok(s3[2].issues.some(function (i) { return i.field === 'phone'; }), '샘플 3종: 3번째 연락처 오류 감지');

  /* ── 15. 실제 카톡 내보내기 한 덩어리 ─────────────────── */
  var fullExport = [
    '--------------- 2024년 5월 12일 일요일 ---------------',
    '[김미숙] [오전 9:10] 네 주문 받았습니다',
    '[김미숙] [오전 9:12] 성함: 박정희',
    '[김미숙] [오전 9:12] 연락처: 010-2345-6789',
    '[김미숙] [오전 9:13] 주소: 전남 완도군 완도읍 장보고대로 123 3층',
    '[김미숙] [오전 9:13] 상품: 완도 활전복 1kg 2박스',
    '[김미숙] [오전 9:15] 감사합니다! 내일 발송합니다'
  ].join('\n');
  var fe = T.parseOrders(fullExport);
  eq(fe.length, 1, '카톡 내보내기 전체: 1건');
  eq(fe[0] && fe[0].name, '박정희', '카톡 내보내기 전체: 라벨 이름이 잡담보다 우선');
  eq(fe[0] && fe[0].phone, '010-2345-6789', '카톡 내보내기 전체: 연락처');
  eq(fe[0] && fe[0].address, '전남 완도군 완도읍 장보고대로 123 3층', '카톡 내보내기 전체: 주소');
  eq(fe[0] && fe[0].qty, '2박스', '카톡 내보내기 전체: 수량');

  /* ── 16. 잡담·인사말은 주문으로 만들지 않음 ───────────── */
  var chatter = T.parseOrders('안녕하세요\n\n오늘도 주문 들어왔습니다\n\n감사합니다');
  eq(chatter.length, 0, '잡담 블록: 주문 0건');
  var chatExport = '[김미숙] [오전 9:12] 안녕하세요\n[김미숙] [오전 9:13] 오늘도 주문 들어왔습니다\n[김미숙] [오전 9:14] 감사합니다';
  eq(T.parseOrders(chatExport).length, 0, '카톡 내보내기 잡담: 주문 0건');
  var partial = T.parseOrders('김철수 / 사과 5kg');
  eq(partial.length, 1, '이름+상품만 있어도 1건으로 유지');
  ok(partial[0].issues.some(function (i) { return i.field === 'phone'; }), '이름+상품만: 연락처 오류 표시');

  /* ── 17. 빈 입력 ──────────────────────────────────────── */
  eq(T.parseOrders('').length, 0, '빈 입력: 0건');
  eq(T.parseOrders('   \n\n  ').length, 0, '공백 입력: 0건');

  /* ── 결과 ─────────────────────────────────────────────── */
  var passed = results.filter(function (r) { return r.pass; }).length;
  var failed = results.length - passed;
  window.__TEST_RESULTS = { total: results.length, passed: passed, failed: failed, results: results };
  var summary = document.getElementById('summary');
  if (summary) {
    summary.textContent = (failed === 0 ? 'ALL PASS' : 'FAILED') + ' — ' + passed + '/' + results.length;
    summary.style.color = failed === 0 ? '#0a6b2d' : '#b3261e';
    summary.style.fontWeight = '700';
  }
})();
