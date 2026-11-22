/* 톡송장 3초 — 1클릭 공유(추천 링크 복사)
 *
 * 변환을 마친 사장님이 같은 공구·산지직송 사장님께 링크를 바로 넘길 수 있게,
 * 추천 문구 + 주소를 클립보드로 복사하고 버튼·안내 문구로 완료를 알립니다.
 * 복사 자체는 app.js 의 copyText(클립보드 API → execCommand 폴백)를 그대로 씁니다.
 */
(function (root, factory) {
  var api = factory();
  if (api) { root.TonShare = api; }
  if (typeof module === 'object' && module.exports) { module.exports = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var URL = 'https://doggonug-cpu.github.io/kakao-invoice/';
  var MESSAGE = '카톡 주문을 통째로 붙여넣으면 택배 송장 CSV로 3초 만에. 1회 5건까지 무료 — 톡송장 3초';
  var IDLE_LABEL = '같은 공구·산지직송 사장님께 공유하기(링크 복사)';
  var DONE_LABEL = '복사했어요 — 대화방에 붙여넣기만 하면 됩니다';
  var DONE_STATUS = '추천 문구와 주소를 복사했습니다. 사장님 대화방에 붙여넣어 보세요.';
  var FAIL_STATUS = '복사가 막혔습니다. 주소창의 주소를 직접 복사해 주세요 — ' + URL;

  function text() { return MESSAGE + ' ' + URL; }

  function feedback(button, status, ok) {
    if (button) {
      button.textContent = ok ? DONE_LABEL : IDLE_LABEL;
      if (button.classList) { button.classList.toggle('is-done', !!ok); }
    }
    if (status) {
      status.textContent = ok ? DONE_STATUS : FAIL_STATUS;
      if (status.classList) { status.classList.toggle('is-err', !ok); }
    }
  }

  function reset(button, status) {
    if (button) {
      button.textContent = IDLE_LABEL;
      if (button.classList) { button.classList.remove('is-done'); }
    }
    if (status) {
      status.textContent = '';
      if (status.classList) { status.classList.remove('is-err'); }
    }
  }

  /* copy: function(text) — Promise 를 돌려주면 완료/실패를 그 결과로 구분합니다. */
  function attach(button, status, copy) {
    if (!button || !button.addEventListener) { return null; }
    var handler = function () {
      var value = text();
      var result = null;
      try {
        result = copy ? copy(value) : null;
      } catch (err) {
        feedback(button, status, false);
        return false;
      }
      if (result && typeof result.then === 'function') {
        result.then(function () { feedback(button, status, true); },
                    function () { feedback(button, status, false); });
      } else if (result === false) {
        feedback(button, status, false);
        return false;
      } else {
        feedback(button, status, true);
      }
      return true;
    };
    button.addEventListener('click', handler);
    return handler;
  }

  return {
    URL: URL,
    MESSAGE: MESSAGE,
    IDLE_LABEL: IDLE_LABEL,
    DONE_LABEL: DONE_LABEL,
    DONE_STATUS: DONE_STATUS,
    FAIL_STATUS: FAIL_STATUS,
    text: text,
    feedback: feedback,
    reset: reset,
    attach: attach
  };
});
