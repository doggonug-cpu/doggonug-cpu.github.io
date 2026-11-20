/* 톡송장 3초 — 파서 단위 테스트 케이스 모음
 * 브라우저(runner.html)와 로컬 검증 스크립트 양쪽에서 같은 케이스를 돌립니다.
 * runCases(T, record) — record(name, pass, detail)
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.__TonSongCases = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function runCases(T, record) {
    var results = [];

    function rec(name, pass, detail) { results.push({ name: name, pass: pass }); record(name, pass, detail); }
    function eq(actual, expected, name) {
      var pass = actual === expected;
      rec(name, pass, pass ? '' : '기대 ' + JSON.stringify(expected) + ' / 실제 ' + JSON.stringify(actual));
    }
    function ok(cond, name, detail) { rec(name, !!cond, detail || ''); }
    function order(i, text) { return T.parseOrders(text)[i || 0] || {}; }
    function headerOf(csv) { return csv.split('\r\n')[0].replace(/^\ufeff/, ''); }
    function hasFlag(o, flag) { return (o.flags || []).indexOf(flag) !== -1; }
    function gates(orders) { return orders.map(function (o) { return o.gate; }).join(','); }

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
    var orders = T.parseOrders('이름: 김철수\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123, 4층\n상품: 사과 5kg\n수량: 2박스\n배송메모: 문 앞, 경비실\n입금자: 김철수');

    var csv = T.toCSV(orders, 'cj');
    eq(csv.charCodeAt(0), 0xFEFF, 'CSV: UTF-8 BOM');
    eq(headerOf(csv), '받는분성명,받는분전화번호,받는분주소,상품명,수량,배송메세지,운송장번호', 'CSV: CJ 헤더 순서');
    ok(csv.indexOf('"문 앞, 경비실"') !== -1, 'CSV: 쉼표 포함 셀 따옴표 처리');
    eq(orders[0].addrBase + '|' + orders[0].addrDetail, '서울시 강남구 테헤란로 123|4층', 'CSV: 쉼표 주소는 기본/상세로 정리');

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

    /* ══ 18. 표준 9열 스키마 ═════════════════════════════════ */
    eq(headerOf(T.toCSV(orders, 'standard9')),
      '수취인명,연락처,우편번호,기본주소,상세주소,품목명,수량,배송메시지,특수플래그',
      '9열: 고정 헤더 9개');
    eq(T.courierById('standard9').columns.length, 9, '9열: 열 개수');
    eq(T.courierById('standard9').recommended, true, '9열: 기본 추천 양식');

    var nine = T.parseOrders('이름: 김철수\n전화: 010-1234-5678\n우편번호: 06236\n주소: 서울시 강남구 테헤란로 123 101동 1001호\n상품: 사과 5kg 2박스');
    eq(nine[0].postcode, '06236', '9열: 우편번호 라벨');
    eq(nine[0].addrBase, '서울시 강남구 테헤란로 123', '9열: 기본주소 분리');
    eq(nine[0].addrDetail, '101동 1001호', '9열: 상세주소 분리');
    var nineRow = T.toCSV(nine, 'standard9').split('\r\n')[1];
    eq(nineRow, '김철수,010-1234-5678,06236,서울시 강남구 테헤란로 123,101동 1001호,사과 5kg,2박스,,',
      '9열: 데이터 행 9칸');

    /* ══ 19. 유형 1 — 1인 다수 배송지 ═══════════════════════ */
    var multiText = '전복 1kg 3박스요. 1개는 우리집(서울 강남구 테헤란로 123 4층), ' +
                    '2개는 어머니댁(부산 해운대구 센텀중앙로 79 101-202 김OO 010-1234-5678) 보내주세요. 보내는 분은 홍길동';
    var multi = T.parseOrders(multiText);
    eq(multi.length, 2, '유형1: 2개 배송지로 분리');
    eq(multi[0].qty, '1개', '유형1: 첫 배송지 수량');
    eq(multi[1].qty, '2개', '유형1: 둘째 배송지 수량');
    eq(multi[0].product, '전복 1kg', '유형1: 품목 공통 적용');
    eq(multi[0].sender, '홍길동', '유형1: 발송인 분리(1)');
    eq(multi[1].sender, '홍길동', '유형1: 발송인 분리(2)');
    eq(multi[1].name, '김OO', '유형1: 둘째 수취인');
    eq(multi[1].phone, '010-1234-5678', '유형1: 둘째 연락처');
    eq(multi[0].addrBase, '서울 강남구 테헤란로 123', '유형1: 첫 배송지 기본주소');
    eq(multi[0].addrDetail, '4층', '유형1: 첫 배송지 상세주소');
    eq(multi[1].addrDetail, '101동 202호', '유형1: 둘째 상세주소 보정');
    eq(multi[0].memo, '배송처: 우리집', '유형1: 배송처 라벨 보존');
    eq(multi[1].memo, '배송처: 어머니댁', '유형1: 배송처 라벨(댁) 보존');
    eq(multi[0].name, '', '유형1: 발송인을 수취인으로 오인하지 않음');
    ok(!hasFlag(multi[0], '수량불일치'), '유형1: 1+2=3 수량 일치');

    var shortText = '전복 1kg 3박스요. 1개는 우리집(서울 강남구 테헤란로 123 4층), ' +
                    '1개는 어머니댁(부산 해운대구 센텀중앙로 79 김OO 010-1234-5678) 보내주세요';
    var short2 = T.parseOrders(shortText);
    eq(short2.length, 2, '유형1: 불일치도 2행 생성');
    ok(hasFlag(short2[0], '수량불일치') && hasFlag(short2[1], '수량불일치'), '유형1: 수량불일치 플래그');
    eq(short2[0].gate, 'red', '유형1: 수량불일치 적색 보류');
    ok(short2[0].issues.some(function (i) { return i.level === 'error' && i.field === 'qty'; }),
      '유형1: 수량불일치 사유 문구');
    ok(T.toCSV(short2, 'standard9').indexOf('[수량불일치]') !== -1, '유형1: 9열 특수플래그에 표기');

    /* ══ 20. 유형 2 — 말풍선 쪼개기 병합 ════════════════════ */
    var bubbles = [
      '[김철수] [오전 10:01] 전복 2박스',
      '[김철수] [오전 10:01] 010 1234 5678',
      '[김철수] [오전 10:02] 수원시 영통구 OO아파트 101-202',
      '[김철수] [오전 10:03] 아 현관비번 #1234*'
    ].join('\n');
    var bb = T.parseOrders(bubbles);
    eq(bb.length, 1, '유형2: 4말풍선 → 1주문');
    eq(bb[0].phone, '010-1234-5678', '유형2: 말풍선 병합 연락처');
    eq(bb[0].product, '전복', '유형2: 말풍선 병합 품목');
    eq(bb[0].qty, '2박스', '유형2: 말풍선 병합 수량');
    eq(bb[0].addrBase, '수원시 영통구 OO아파트', '유형2: 기본주소');
    eq(bb[0].addrDetail, '101동 202호', '유형2: 상세주소');
    ok(/현관비번/.test(bb[0].memo), '유형2: 배송메시지 분리');
    eq(bb[0].memo.slice(-1), '*', '유형2: 현관비번 별표 보존');

    var gapText = [
      '[김철수] [오전 10:01] 전복 2박스',
      '[김철수] [오전 10:02] 010-1234-5678',
      '[김철수] [오전 10:09] 서울시 강남구 테헤란로 123'
    ].join('\n');
    var gapOpen = T.parseOrders(gapText);
    eq(gapOpen.length, 2, '유형2: 6분 이상 벌어지면 다른 세션');
    ok(!gapOpen[1].phone && gapOpen[0].phone, '유형2: 끊긴 세션은 따로 검사');
    var nearText = [
      '[김철수] [오전 10:01] 전복 2박스',
      '[김철수] [오전 10:02] 010-1234-5678',
      '[김철수] [오전 10:05] 서울시 강남구 테헤란로 123'
    ].join('\n');
    eq(T.parseOrders(nearText).length, 1, '유형2: 4분 간격은 한 세션');

    var twoSpeakers = [
      '[박사장] [오전 11:00] 네 주문 받았습니다',
      '[이영희] [오전 11:00] 이영희 010-2222-3333 부산시 해운대구 센텀중앙로 79 / 배 3kg 1박스',
      '[박사장] [오전 11:01] 네 확인했습니다'
    ].join('\n');
    var ts = T.parseOrders(twoSpeakers);
    eq(ts.length, 1, '유형2: 두 발화자 세션도 1건');
    eq(ts[0].name, '이영희', '유형2: 주문 발화자를 수취인으로');

    /* ══ 21. 유형 3 — 정정·취소 ═════════════════════════════ */
    var fixText = [
      '[김철수] [오전 10:01] 전복 2박스',
      '[김철수] [오전 10:01] 010-1234-5678',
      '[김철수] [오전 10:02] 수원시 영통구 OO아파트 101-202',
      '[김철수] [오전 10:04] 아 3박스로 바꿀게요'
    ].join('\n');
    var fix = T.parseOrders(fixText);
    eq(fix.length, 1, '유형3: 정정 세션 1건');
    eq(fix[0].qty, '3박스', '유형3: 최종 수량 반영');
    ok(hasFlag(fix[0], '정정발화'), '유형3: [정정발화] 플래그');
    eq(fix[0].gate, 'yellow', '유형3: 황색 확인');
    ok(!!fix[0].raw && fix[0].raw.indexOf('바꿀게요') !== -1, '유형3: 원본 대화 미리보기 보존');

    var cancelText = '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스 / 아 그거 취소할게요';
    var cancel = T.parseOrders(cancelText);
    ok(hasFlag(cancel[0], '취소발화'), '유형3: [취소발화] 플래그');
    eq(cancel[0].gate, 'yellow', '유형3: 취소도 황색 확인');

    var onlyCancel = T.parseOrders('아까 그 주문 취소할게요');
    eq(onlyCancel.length, 1, '유형3: 취소만 온 말풍선도 행으로');
    eq(onlyCancel[0].gate, 'yellow', '유형3: 정정만 있는 행은 적색 아님');
    ok(hasFlag(onlyCancel[0], '취소발화'), '유형3: 정정만 온 행 플래그');

    /* ══ 22. 유형 4 — 단골 생략 ═════════════════════════════ */
    var regular = T.parseOrders('사장님 저 박영희예요 저번 주소로 2박스만요 입금했어요!');
    eq(regular.length, 1, '유형4: 단골 발화 1건');
    eq(regular[0].name, '박영희', '유형4: 이름 추출');
    ok(hasFlag(regular[0], '단골확인필요'), '유형4: [단골확인필요] 플래그');
    eq(regular[0].address, '', '유형4: 주소를 추측해 채우지 않음');
    eq(regular[0].gate, 'red', '유형4: 적색 격리');

    /* ══ 23. 유형 5 — 비표준 표기 보정 ══════════════════════ */
    eq(T.normalizePhone('010.1234.5678').value, '010-1234-5678', '유형5: 점 표기 연락처');
    var dotted = order(0, '김철수 010.1234.5678 서울시 마포구 월드컵로 10');
    eq(dotted.phone, '010-1234-5678', '유형5: 점 표기 → 하이픈');

    var unitFix = order(0, '이름: 김철수\n전화: 010-1234-5678\n주소: 인천시 연수구 송도과학로 32 105-802');
    eq(unitFix.addrDetail, '105동 802호', '유형5: 105-802 → 105동 802호');
    eq(unitFix.addrBase, '인천시 연수구 송도과학로 32', '유형5: 기본주소 분리');
    var roadDash = order(0, '이름: 김철수\n전화: 010-1234-5678\n주소: 서울시 강남구 테헤란로 123-4');
    eq(roadDash.address, '서울시 강남구 테헤란로 123-4', '유형5: 도로명 123-4는 그대로');

    /* ══ 24. 유형 6 — 닉네임·3필드 분리 ═════════════════════ */
    var who = T.parseOrders('받는분: 사랑맘\n연락처: 010-9999-8888\n주소: 제주시 애월읍 하귀리 123 3층\n상품: 감귤 5kg 2박스\n입금자: 김미숙\n보내는 분은 홍길동');
    eq(who[0].name, '사랑맘', '유형6: 수취인명 그대로');
    eq(who[0].depositor, '김미숙', '유형6: 입금자명 분리');
    eq(who[0].sender, '홍길동', '유형6: 발송인명 분리');
    ok(hasFlag(who[0], '닉네임주의'), '유형6: [닉네임주의] 플래그');
    ok(who[0].issues.some(function (i) { return i.field === 'name' && i.level === 'warn'; }),
      '유형6: 닉네임은 경고(황색)');
    eq(T.looksLikeNickname('ㅇㅇ맘'), true, '유형6: ㅇㅇ맘 감지');
    eq(T.looksLikeNickname('공주'), true, '유형6: 공주 감지');
    eq(T.looksLikeNickname('김철수'), false, '유형6: 실명은 통과');

    /* ══ 25. 유형 7 — 도서산간·배송 조건 ════════════════════ */
    var island = order(0, '김철수 010-1234-5678 제주시 애월읍 하귀리 123 3층 / 감귤 5kg 1박스');
    ok(hasFlag(island, '도서산간 +추가운임'), '유형7: 제주 → 도서산간 태깅');
    var island2 = order(0, '김철수 010-1234-5678 전남 완도군 완도읍 장보고대로 123 / 전복 1kg 2박스');
    ok(hasFlag(island2, '도서산간 +추가운임'), '유형7: 완도군 → 도서산간 태깅');
    var inland = order(0, '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스');
    ok(!hasFlag(inland, '도서산간 +추가운임'), '유형7: 내륙은 태깅 없음');

    var memoLong = '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스 / ' +
      '아이스팩 넣어서 보내주시고 도착하면 문자 주세요';
    var ml = order(0, memoLong);
    ok(/아이스팩/.test(ml.memo), '유형7: 아이스팩 → 배송메시지');
    var longMemo = '김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스 / ' +
      '문 앞에 놓아주시고 벨은 누르지 마세요 현관 비밀번호는 1234* 이고 금요일 오후 도착하면 좋겠습니다 경비실에도 알려주세요 감사합니다';
    var lm = order(0, longMemo);
    ok(lm.memo.length > 50, '유형7: 긴 메모 길이 유지(' + (lm.memo || '').length + '자)');
    ok(lm.issues.some(function (i) { return i.field === 'memo' && /50자/.test(i.message); }),
      '유형7: 50자 초과 경고 + 글자수');

    /* ══ 26. 유형 8 — 사진 주문 ═════════════════════════════ */
    var photo = T.parseOrders('[사진]');
    eq(photo.length, 1, '유형8: 사진만 와도 행 생성');
    ok(hasFlag(photo[0], '사진확인필요'), '유형8: [사진확인필요] 플래그');
    eq(photo[0].gate, 'red', '유형8: 사진 행은 적색');
    eq(photo[0].name, '', '유형8: 사진 본문을 추측하지 않음');
    var photo2 = T.parseOrders('[사진]\n사진 보냈어요 확인 부탁드려요');
    eq(photo2.length, 1, '유형8: 사진+설명 1행');
    eq(photo2[0].gate, 'red', '유형8: 사진+설명 적색');
    var photo3 = T.parseOrders('김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스\n[사진] 주문서 캡처입니다');
    eq(photo3.length, 1, '유형8: 주문+사진은 1건 유지');
    ok(hasFlag(photo3[0], '사진확인필요'), '유형8: 주문+사진 플래그');
    eq(photo3[0].gate, 'yellow', '유형8: 내용이 다 있으면 황색 확인');

    /* ══ 27. 당일 중복의심 ══════════════════════════════════ */
    var dup = T.parseOrders(
      '이영희 010-7777-6666 인천시 연수구 송도과학로 32 202호 / 배 3kg 1박스\n\n' +
      '이영희 010-7777-6666 인천시 연수구 송도과학로 32 202호 / 배 3kg 1박스'
    );
    eq(dup.length, 2, '중복: 2행 유지');
    ok(hasFlag(dup[0], '중복의심') && hasFlag(dup[1], '중복의심'), '중복: 두 행 모두 표기');
    eq(dup[0].gate, 'yellow', '중복: 황색 확인');
    var uniq = T.parseOrders('김철수 010-1234-5678 서울시 강남구 테헤란로 123 / 사과 2박스\n\n이영희 010-2222-3333 부산시 해운대구 센텀중앙로 79 / 배 1박스');
    ok(!hasFlag(uniq[0], '중복의심'), '중복: 다른 주문은 표기 없음');

    /* ══ 28. 9열 CSV 마무리 ═════════════════════════════════ */
    var out = T.parseOrders('받는분: 김철수\n연락처: 010-1234-5678\n주소: 전남 완도군 완도읍 장보고대로 123 3층\n품목: 전복 1kg\n수량: 2박스\n배송메시지: 문 앞');
    var outCsv = T.toCSV(out, 'standard9');
    var outRow = outCsv.split('\r\n')[1];
    ok(outRow.indexOf('전남 완도군 완도읍 장보고대로 123,3층,전복 1kg,2박스,문 앞,[도서산간 +추가운임]') !== -1,
      '9열: 주소·플래그가 순서대로');
    eq(headerOf(T.toCSV(out, 'standard9', { includeSender: true })).split(',').pop(), '발송인', '9열: 발송인 열 옵션');

    var gateCounts = { green: 0, yellow: 0, red: 0 };
    T.parseOrders(labeled).forEach(function (o) { gateCounts[o.gate] += 1; });
    eq(gateCounts.green, 1, '게이트: 정상 주문은 녹색');
    eq(T.parseOrders('이름: 김철수\n전화: 010-5555-66\n주소: 서울시 강남구 테헤란로 123')[0].gate, 'red',
      '게이트: 연락처 오류는 적색');

    return { total: results.length, passed: results.filter(function (r) { return r.pass; }).length };
  }

  return runCases;
});
