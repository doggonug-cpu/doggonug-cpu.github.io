/* 톡송장 3초 — parser.js 단위 테스트 실행기 (브라우저에서 runner.html 로 실행) */
(function () {
  'use strict';

  var T = window.TalkInvoice;
  var runner = window.__TonSongCases;
  var results = [];
  var log = document.getElementById('log');

  function record(name, pass, detail) {
    results.push({ name: name, pass: pass, detail: detail || '' });
    var li = document.createElement('li');
    li.className = pass ? 'pass' : 'fail';
    li.textContent = (pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' — ' + detail);
    if (log) { log.appendChild(li); }
  }

  if (!T || !runner) {
    record('테스트 준비', false, 'parser.js 또는 cases.js를 불러오지 못했습니다');
  } else {
    runner(T, record);
  }

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
