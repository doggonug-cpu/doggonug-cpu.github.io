/* 톡송장 3초 — GA4 퍼널 계측 (개인정보 전송 금지)
 *
 * 허용 이벤트는 4종뿐입니다.
 *   page_view    — gtag config 로 자동 전송 (이 파일에서 직접 보내지 않음)
 *   convert_run  — 변환 실행. 파라미터 { orders: 건수(숫자) } 만
 *   paywall_hit  — 6번째 행부터 Pro 잠금에 닿음. 파라미터 { locked: 건수(숫자) } 만
 *   cta_click    — 결제 동선 클릭. 파라미터 { cta_type: 'kmong' | 'bank_transfer' } 만
 *
 * 호출하는 쪽이 실수로 이름·전화번호·주소·주문 원문을 파라미터에 넣어도
 * buildPayload 가 화이트리스트에 없는 키를 전부 버립니다. 값도 숫자 또는 정해진
 * 문자열만 통과하므로, 주문 개인정보가 GA로 나가는 경로는 없습니다.
 */
(function (root, factory) {
  var api = factory();
  if (api) { root.TonAnalytics = api; }
  if (typeof module === 'object' && module.exports) { module.exports = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var G = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : {});

  var MEASUREMENT_ID = 'G-37PP2BP7Z6';
  var EVENTS = ['page_view', 'convert_run', 'paywall_hit', 'cta_click'];
  var NUMERIC_PARAMS = {
    convert_run: ['orders'],
    paywall_hit: ['locked']
  };
  var ENUM_PARAMS = {
    cta_click: { cta_type: ['kmong', 'bank_transfer'] }
  };
  var CONVERT_GAP_MS = 15000; /* 같은 방문에서 변환 실행 이벤트는 15초에 한 번 */

  function isCount(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0;
  }

  /* 화이트리스트 밖의 이벤트 이름·파라미터는 null 로 버립니다. */
  function buildPayload(name, params) {
    if (EVENTS.indexOf(name) === -1) { return null; }
    var out = {};
    var nums = NUMERIC_PARAMS[name] || [];
    var enums = ENUM_PARAMS[name] || {};
    var i;
    for (i = 0; i < nums.length; i++) {
      if (params && isCount(params[nums[i]])) { out[nums[i]] = Math.round(params[nums[i]]); }
    }
    var keys = Object.keys(enums);
    for (i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = params ? params[key] : undefined;
      if (typeof value === 'string' && enums[key].indexOf(value) !== -1) { out[key] = value; }
    }
    return { name: name, params: out };
  }

  function send(name, params, sender) {
    var payload = buildPayload(name, params);
    if (!payload) { return false; }
    var fn = sender || (typeof G.gtag === 'function' ? G.gtag : null);
    if (!fn) { return false; }
    try {
      fn('event', payload.name, payload.params);
    } catch (err) {
      return false;
    }
    return true;
  }

  var lastConvertAt = 0;

  function convertRun(count, sender, now) {
    var stamp = typeof now === 'number' ? now : Date.now();
    if (lastConvertAt && stamp - lastConvertAt < CONVERT_GAP_MS) { return false; }
    var ok = send('convert_run', { orders: count }, sender);
    if (ok) { lastConvertAt = stamp; }
    return ok;
  }

  function paywallHit(locked, sender) {
    return send('paywall_hit', { locked: locked }, sender);
  }

  function ctaClick(type, sender) {
    return send('cta_click', { cta_type: type }, sender);
  }

  function resetConvertThrottle() { lastConvertAt = 0; }

  return {
    MEASUREMENT_ID: MEASUREMENT_ID,
    EVENTS: EVENTS,
    CONVERT_GAP_MS: CONVERT_GAP_MS,
    buildPayload: buildPayload,
    send: send,
    convertRun: convertRun,
    paywallHit: paywallHit,
    ctaClick: ctaClick,
    resetConvertThrottle: resetConvertThrottle
  };
});
