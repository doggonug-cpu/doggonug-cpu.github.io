/* A11yKit — app.js
   No dependencies, no external requests except the waitlist POST when you submit the form.
   Every visible string has an English and a Korean version in T below. */

(function () {
  'use strict';

  var root = document.documentElement;
  var errors = (window.__a11yUiKitErrors = window.__a11yUiKitErrors || []);
  window.addEventListener('error', function (e) { errors.push(String(e.message || 'error')); });
  window.addEventListener('unhandledrejection', function (e) { errors.push('unhandled: ' + String(e.reason)); });

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var state = {
    lang: store.get('a11ykit.lang') === 'ko' ? 'ko' : 'en',
    sound: store.get('a11ykit.sound') !== 'off',
    textsize: store.get('a11ykit.textsize') || '100',
    contrast: store.get('a11ykit.contrast') === 'hc'
  };

  var T = {
    en: {
      copied: 'Copied to clipboard',
      copyFail: 'Could not copy — select the text and press Ctrl+C',
      locked: 'That component is Pro. Join the list from the pricing section.',
      taken: 'Taken',
      take: 'Take',
      medCount: function (n, t) { return n + ' of ' + t + ' taken'; },
      bigConfirm: 'Confirmed. Your change is saved.',
      bigCancel: 'Cancelled. Nothing was changed.',
      bigHelp: 'A staff member has been called to help.',
      kioskNone: 'Nothing selected.',
      kioskPicked: function (label) { return 'Selected: ' + label + '. Press Next to continue.'; },
      stepsLine: function (i, total, name) { return 'Step ' + i + ' of ' + total + ' \u00b7 ' + name; },
      speechUnsupported: 'This browser has no speech voice. The text above is the full content.',
      speechSpeaking: 'Reading aloud. Press Stop to end it.',
      speechDone: 'Finished reading.',
      speechStopped: 'Stopped.',
      digits: function (n) { return n ? n + ' digit' + (n === 1 ? '' : 's') + ' entered.' : 'No digits entered.'; },
      keypadOk: 'Accepted — demo only, nothing was sent.',
      confirmDone: 'Deleted 14 photos (demo).',
      confirmCancel: 'Cancelled. Nothing was deleted.',
      formName: 'Enter your name.',
      formPhone: 'Enter a phone number.',
      formPhoneBad: 'Enter at least 9 digits, numbers only.',
      formDate: 'Choose a date.',
      formSummary: function (n) { return 'Please check ' + n + ' field' + (n === 1 ? '' : 's') + ' below.'; },
      formOk: 'Request recorded. This demo does not send anything.',
      filterAll: 'Showing all 18 components.',
      filterFree: 'Showing the 10 free components.',
      filterPro: 'Showing the 8 Pro components.',
      heroTaken: 'Recorded. Next dose at 12:30.',
      heroCalling: 'Calling your daughter… (demo only)',
      heroSpeech: 'Good morning, Mrs. Lee. Wednesday 18 November, 8:30. Blood pressure, one tablet, not taken yet. Call my daughter: one tap.',
      modalOpen: 'Pro early access',
      emailEmpty: 'Enter your email address.',
      emailBad: 'That does not look like an email address.',
      sending: 'Sending…',
      sent: 'You are on the list. We will write when checkout opens.',
      sendFail: 'Sending failed. Check your connection and try again.',
      close: 'Close',
      soundOn: 'On',
      soundOff: 'Off',
      muted: 'Sound cues off',
      hcOn: 'On',
      hcOff: 'Off'
    },
    ko: {
      copied: '클립보드에 복사했습니다',
      copyFail: '복사하지 못했습니다. 본문을 선택해 Ctrl+C를 눌러 주세요',
      locked: 'Pro 컴포넌트입니다. 가격 섹션에서 대기 명단에 신청해 주세요.',
      taken: '먹음',
      take: '먹기',
      medCount: function (n, t) { return t + '번 중 ' + n + '번 복용'; },
      bigConfirm: '확인했습니다. 변경 사항을 저장했습니다.',
      bigCancel: '취소했습니다. 바뀐 내용은 없습니다.',
      bigHelp: '도와드릴 직원을 불렀습니다.',
      kioskNone: '아직 선택하지 않았습니다.',
      kioskPicked: function (label) { return label + ' 선택됨. 다음을 누르면 이어집니다.'; },
      stepsLine: function (i, total, name) { return total + '단계 중 ' + i + '단계 \u00b7 ' + name; },
      speechUnsupported: '이 브라우저에는 음성 엔진이 없습니다. 위 본문이 전체 내용입니다.',
      speechSpeaking: '읽고 있습니다. 멈추려면 정지를 누르세요.',
      speechDone: '읽기를 마쳤습니다.',
      speechStopped: '멈췄습니다.',
      digits: function (n) { return n ? n + '자리 입력됨.' : '입력된 숫자가 없습니다.'; },
      keypadOk: '확인했습니다. 데모라 어디로도 전송하지 않았습니다.',
      confirmDone: '사진 14장을 지웠습니다. (데모)',
      confirmCancel: '취소했습니다. 지운 사진은 없습니다.',
      formName: '이름을 입력해 주세요.',
      formPhone: '전화번호를 입력해 주세요.',
      formPhoneBad: '숫자 9자리 이상 입력해 주세요.',
      formDate: '방문 희망일을 선택해 주세요.',
      formSummary: function (n) { return '아래 ' + n + '개 항목을 확인해 주세요.'; },
      formOk: '접수했습니다. 이 데모는 어디로도 전송하지 않습니다.',
      filterAll: '컴포넌트 18종을 모두 보여줍니다.',
      filterFree: '무료 10종을 보여줍니다.',
      filterPro: 'Pro 8종을 보여줍니다.',
      heroTaken: '기록했습니다. 다음 복용은 12시 30분입니다.',
      heroCalling: '딸에게 거는 중… (데모)',
      heroSpeech: '좋은 아침이에요, 이 여사님. 11월 18일 수요일, 8시 30분. 혈압약 한 정, 아직 드시지 않았어요. 딸에게 전화는 한 번만 누르면 됩니다.',
      modalOpen: 'Pro 얼리 액세스',
      emailEmpty: '이메일을 입력해 주세요.',
      emailBad: '이메일 형식이 아닙니다.',
      sending: '보내는 중…',
      sent: '명단에 올렸습니다. 결제가 열리면 이메일로 알려드립니다.',
      sendFail: '보내지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',
      close: '닫기',
      soundOn: '켜짐',
      soundOff: '꺼짐',
      muted: '소리 안내를 껐습니다',
      hcOn: '켜짐',
      hcOff: '꺼짐'
    }
  };
  function t() { return T[state.lang]; }

  /* ---------- sound ---------- */
  var actx = null;
  function audio() {
    if (!state.sound) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) { try { actx = new AC(); } catch (e) { return null; } }
    if (actx.state === 'suspended') { actx.resume(); }
    return actx;
  }
  function tone(freq, dur, type, gain, delay) {
    var c = audio(); if (!c) return;
    var start = c.currentTime + (delay || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dur + 0.03);
  }
  var S = {
    tap: function () { tone(880, 0.06, 'sine', 0.05); },
    ok: function () { tone(660, 0.09, 'sine', 0.05); tone(990, 0.12, 'sine', 0.045, 0.07); },
    err: function () { tone(320, 0.14, 'square', 0.035); tone(220, 0.18, 'square', 0.03, 0.1); },
    down: function () { tone(420, 0.1, 'triangle', 0.05); tone(280, 0.16, 'triangle', 0.04, 0.08); },
    nav: function () { tone(520, 0.05, 'triangle', 0.045); }
  };

  /* ---------- clipboard ---------- */
  function writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'readonly');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (!ok) { throw new Error('copy'); }
  }

  var toastEl = document.querySelector('[data-toast]');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* ---------- catalog ---------- */
  var catalogPromise = null;
  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch('catalog.json').then(function (r) {
        if (!r.ok) { throw new Error('catalog ' + r.status); }
        return r.json();
      });
    }
    return catalogPromise;
  }

  document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      e.preventDefault();
      handleCopy(copyBtn);
      return;
    }
    var textBtn = e.target.closest('[data-copy-text]');
    if (textBtn) {
      e.preventDefault();
      var key = textBtn.getAttribute('data-copy-text');
      var src = document.querySelector('[data-code-text="' + key + '"]');
      if (!src) { return; }
      writeClipboard(src.textContent).then(function () {
        toast(t().copied); S.ok();
      }).catch(function () {
        toast(t().copyFail); S.err();
      });
    }
  });

  function handleCopy(btn) {
    var id = btn.getAttribute('data-id');
    var kind = btn.getAttribute('data-copy');
    var format = btn.getAttribute('data-format') || 'html';
    loadCatalog().then(function (data) {
      var item = data && data.components ? data.components[id] : null;
      if (!item) { throw new Error('missing component ' + id); }
      var text = '';
      if (kind === 'prompt') {
        text = (item.prompt && (item.prompt[state.lang] || item.prompt.en)) || '';
      } else if (item.code) {
        text = format === 'react' ? item.code.react : item.code.html;
      }
      if (!text) { throw new Error('locked'); }
      return writeClipboard(text).then(function () {
        toast(t().copied);
        S.ok();
      });
    }).catch(function (err) {
      if (String(err && err.message) === 'locked') {
        toast(t().locked);
      } else {
        toast(t().copyFail);
      }
      S.err();
    });
  }

  /* ---------- settings UI ---------- */
  function applySound() {
    root.setAttribute('data-sound', state.sound ? 'on' : 'off');
    var btn = document.querySelector('[data-sound-toggle]');
    if (btn) {
      btn.setAttribute('aria-checked', state.sound ? 'true' : 'false');
      var st = btn.querySelector('[data-sound-state]');
      if (st) { st.textContent = state.sound ? t().soundOn : t().soundOff; }
      var use = btn.querySelector('use');
      if (use) { use.setAttribute('href', state.sound ? '#i-speaker' : '#i-mute'); }
    }
    var heroSound = document.querySelector('[data-hero-sound]');
    if (heroSound) {
      heroSound.textContent = state.sound
        ? (state.lang === 'ko' ? '소리 켜짐' : 'Sound on')
        : (state.lang === 'ko' ? '소리 꺼짐' : 'Sound off');
    }
  }
  function applyTextsize() {
    root.setAttribute('data-textsize', state.textsize);
    document.querySelectorAll('[data-textsize-set]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-textsize-set') === state.textsize ? 'true' : 'false');
    });
  }
  function applyContrast() {
    root.setAttribute('data-theme', state.contrast ? 'hc' : 'dark');
    var btn = document.querySelector('[data-contrast-toggle]');
    if (btn) {
      btn.setAttribute('aria-checked', state.contrast ? 'true' : 'false');
      var st = btn.querySelector('[data-contrast-state]');
      if (st) { st.textContent = state.contrast ? t().hcOn : t().hcOff; }
    }
  }

  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-sound-toggle]');
    if (s) {
      state.sound = !state.sound;
      store.set('a11ykit.sound', state.sound ? 'on' : 'off');
      applySound();
      if (state.sound) { S.ok(); } else { toast(t().muted); }
      return;
    }
    var ts = e.target.closest('[data-textsize-set]');
    if (ts) {
      state.textsize = ts.getAttribute('data-textsize-set');
      store.set('a11ykit.textsize', state.textsize);
      applyTextsize();
      S.tap();
      return;
    }
    var c = e.target.closest('[data-contrast-toggle]');
    if (c) {
      state.contrast = !state.contrast;
      store.set('a11ykit.contrast', state.contrast ? 'hc' : 'dark');
      applyContrast();
      S.tap();
      return;
    }
    var l = e.target.closest('[data-lang]');
    if (l) {
      setLang(l.getAttribute('data-lang'));
      return;
    }
  });

  /* ---------- i18n ---------- */
  function captureI18n() {
    document.querySelectorAll('[data-ko]').forEach(function (el) {
      if (!el.dataset.en) { el.dataset.en = el.textContent.trim(); }
    });
    document.querySelectorAll('[data-ko-ph]').forEach(function (el) {
      if (!el.dataset.enPh) { el.dataset.enPh = el.getAttribute('placeholder') || ''; }
    });
    var meta = document.querySelector('meta[name="description"]');
    if (meta && !meta.dataset.en) { meta.dataset.en = meta.getAttribute('content') || ''; }
  }
  function applyLang() {
    root.lang = state.lang;
    document.title = state.lang === 'ko'
      ? 'A11yKit — 시니어·접근성 우선 UI 컴포넌트와 MCP 서버 (WCAG AAA)'
      : 'A11yKit — Senior-first accessible UI components for AI builders (WCAG AAA, MCP)';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', state.lang === 'ko'
        ? '시니어를 위한 18종 UI 컴포넌트: 48px 이상 타깃, 18.4:1 본문 대비, 오디오 파일 없는 합성 사운드, Claude Code·Cursor용 로컬 MCP 서버. 무료 10종은 MIT입니다.'
        : (meta.dataset.en || meta.getAttribute('content')));
    }
    document.querySelectorAll('[data-ko]').forEach(function (el) {
      el.textContent = state.lang === 'ko' ? el.dataset.ko : el.dataset.en;
    });
    document.querySelectorAll('[data-ko-ph]').forEach(function (el) {
      el.setAttribute('placeholder', state.lang === 'ko' ? el.getAttribute('data-ko-ph') : el.dataset.enPh);
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false');
    });
    applySound();
    applyContrast();
    resetLive();
    syncMedLabels();
    syncHeroLabels();
    updateFilterStatus(currentFilter);
  }
  function setLang(lang) {
    if (lang !== 'en' && lang !== 'ko') { return; }
    if (lang === state.lang) { return; }
    state.lang = lang;
    store.set('a11ykit.lang', lang);
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    applyLang();
    S.tap();
  }

  /* ---------- live regions ---------- */
  function liveEl(key) { return document.querySelector('[data-live="' + key + '"]'); }
  function setLive(key, text) {
    var el = liveEl(key);
    if (el) { el.textContent = text; }
  }
  function syncHeroLabels() {
    var chip = document.querySelector('.hd__check');
    if (chip) {
      var done = heroMed && heroMed.classList.contains('is-done');
      chip.textContent = state.lang === 'ko' ? (done ? '완료' : '먹기') : (done ? 'Taken' : 'Take');
    }
  }
  function resetLive() {
    var d = t();
    setLive('big', state.lang === 'ko' ? '아직 누른 것이 없습니다.' : 'Nothing pressed yet.');
    setLive('kiosk', d.kioskNone);
    setLive('speech', '');
    setLive('confirm', '');
    setLive('keypad', state.lang === 'ko' ? '데모입니다. 어디로도 전송되지 않습니다.' : 'Demo only — nothing is sent.');
    var formStatus = document.querySelector('[data-form-status]');
    if (formStatus) { formStatus.textContent = ''; formStatus.classList.remove('is-ok'); }
    var steps = stepsState();
    if (steps) { announceStep(steps); }
    var summary = document.querySelector('[data-form-summary]');
    if (summary) { summary.hidden = true; summary.innerHTML = ''; }
  }

  /* ---------- hero ---------- */
  var heroMed = document.querySelector('[data-hero-med]');
  if (heroMed) {
    heroMed.addEventListener('click', function () {
      var done = heroMed.classList.toggle('is-done');
      var check = heroMed.querySelector('.hd__check');
      var small = heroMed.querySelector('small');
      if (check) {
        check.textContent = done ? (state.lang === 'ko' ? '완료' : 'Taken') : (state.lang === 'ko' ? '먹기' : 'Take');
        check.setAttribute('data-ko', done ? '완료' : '먹기');
        check.dataset.en = done ? 'Taken' : 'Take';
      }
      if (small) {
        small.textContent = done
          ? (state.lang === 'ko' ? '오전 8시 30분 · 복용 완료' : '8:30 AM · taken')
          : (state.lang === 'ko' ? '오전 8시 30분 · 아직 안 드셨어요' : '8:30 AM · not taken yet');
        small.setAttribute('data-ko', done ? '오전 8시 30분 · 복용 완료' : '오전 8시 30분 · 아직 안 드셨어요');
        small.dataset.en = done ? '8:30 AM · taken' : '8:30 AM · not taken yet';
      }
      var status = document.querySelector('[data-hero-status]');
      if (status) { status.textContent = done ? t().heroTaken : ''; }
      if (done) { S.ok(); } else { S.tap(); }
    });
  }
  var heroCall = document.querySelector('[data-hero-call]');
  if (heroCall) {
    heroCall.addEventListener('click', function () {
      S.nav();
      var status = document.querySelector('[data-hero-status]');
      if (status) { status.textContent = t().heroCalling; }
    });
  }
  var heroListen = document.querySelector('[data-hero-listen]');
  if (heroListen) {
    heroListen.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) {
        var st = document.querySelector('[data-hero-status]');
        if (st) { st.textContent = t().speechUnsupported; }
        return;
      }
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(t().heroSpeech);
      u.lang = state.lang === 'ko' ? 'ko-KR' : 'en-US';
      u.rate = 0.9;
      var st2 = document.querySelector('[data-hero-status]');
      if (st2) { st2.textContent = t().speechSpeaking; }
      u.onend = function () { if (st2) { st2.textContent = ''; } };
      S.tap();
      window.speechSynthesis.speak(u);
    });
  }

  /* ---------- 01 big action buttons ---------- */
  document.querySelectorAll('[data-ax]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-ax');
      if (kind === 'confirm') { S.ok(); setLive('big', t().bigConfirm); }
      else if (kind === 'cancel') { S.down(); setLive('big', t().bigCancel); }
      else { S.nav(); setLive('big', t().bigHelp); }
    });
  });

  /* ---------- 02 text scale + contrast ---------- */
  var scaleScope = document.querySelector('[data-scale-scope]');
  if (scaleScope) {
    var scaleBody = scaleScope.querySelector('[data-scale-body]');
    scaleScope.querySelectorAll('[data-scale]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-scale');
        scaleScope.querySelectorAll('[data-scale]').forEach(function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        if (scaleBody) { scaleBody.style.setProperty('--scale', String(Number(v) / 100)); }
        S.tap();
      });
    });
    var hcBtn = scaleScope.querySelector('[data-hc-scope]');
    if (hcBtn) {
      hcBtn.addEventListener('click', function () {
        var on = hcBtn.getAttribute('aria-checked') !== 'true';
        hcBtn.setAttribute('aria-checked', on ? 'true' : 'false');
        if (scaleBody) { scaleBody.setAttribute('data-hc', on ? 'on' : 'off'); }
        S.tap();
      });
    }
  }

  /* ---------- 03 medication ---------- */
  var medItems = document.querySelectorAll('[data-med]');
  function syncMedLabels() {
    var d = t();
    document.querySelectorAll('[data-med]').forEach(function (item) {
      var on = item.getAttribute('aria-pressed') === 'true';
      var st = item.querySelector('.med__state');
      if (st) { st.textContent = on ? d.taken : d.take; }
    });
    var count = document.querySelector('[data-med-count]');
    if (count) {
      var total = medItems.length;
      var done = document.querySelectorAll('[data-med][aria-pressed="true"]').length;
      count.textContent = done === 0
        ? (state.lang === 'ko' ? '아직 복용 전' : 'None taken yet')
        : d.medCount(done, total);
    }
  }
  medItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var on = item.getAttribute('aria-pressed') !== 'true';
      item.setAttribute('aria-pressed', on ? 'true' : 'false');
      syncMedLabels();
      var count = document.querySelector('[data-med-count]');
      if (on) {
        S.ok();
        if (count) {
          var total = medItems.length;
          var done = document.querySelectorAll('[data-med][aria-pressed="true"]').length;
          count.setAttribute('aria-label', state.lang === 'ko'
            ? item.querySelector('.med__name').textContent + ' 복용 완료. ' + t().medCount(done, total)
            : item.querySelector('.med__name').textContent + ' marked as taken. ' + t().medCount(done, total));
        }
      } else { S.tap(); }
    });
  });
  if (medItems.length) { syncMedLabels(); }

  /* ---------- 04 kiosk ---------- */
  var kiosk = document.querySelector('[data-kiosk]');
  if (kiosk) {
    var opts = Array.prototype.slice.call(kiosk.querySelectorAll('[role="radio"]'));
    function selectKiosk(idx, announce) {
      opts.forEach(function (o, i) {
        o.setAttribute('aria-checked', i === idx ? 'true' : 'false');
        o.setAttribute('tabindex', i === idx ? '0' : '-1');
      });
      if (announce !== false) {
        var label = opts[idx].querySelector('span:last-child');
        S.tap();
        setLive('kiosk', t().kioskPicked(label ? label.textContent.trim() : opts[idx].textContent.trim()));
      }
    }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function () { selectKiosk(i); });
      o.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { next = (i + 1) % opts.length; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { next = (i - 1 + opts.length) % opts.length; }
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectKiosk(i); return; }
        if (next !== null) { e.preventDefault(); opts[next].focus(); selectKiosk(next); }
      });
    });
  }

  /* ---------- 05 read aloud ---------- */
  var speakBtn = document.querySelector('[data-speak]');
  var speakStop = document.querySelector('[data-speak-stop]');
  var speakSource = document.querySelector('[data-readtext]');
  function stopSpeech(msg) {
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    if (msg) { setLive('speech', msg); }
  }
  if (speakBtn) {
    speakBtn.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) { setLive('speech', t().speechUnsupported); S.err(); return; }
      window.speechSynthesis.cancel();
      var rateSel = document.querySelector('[data-speak-rate]');
      var u = new SpeechSynthesisUtterance(speakSource ? speakSource.textContent.trim() : '');
      u.lang = state.lang === 'ko' ? 'ko-KR' : 'en-US';
      u.rate = rateSel ? Number(rateSel.value) : 0.9;
      setLive('speech', t().speechSpeaking);
      S.tap();
      u.onend = function () { setLive('speech', t().speechDone); };
      u.onerror = function () { setLive('speech', t().speechUnsupported); };
      window.speechSynthesis.speak(u);
    });
  }
  if (speakStop) {
    speakStop.addEventListener('click', function () {
      stopSpeech(t().speechStopped);
      S.down();
    });
  }

  /* ---------- 06 two-step confirm ---------- */
  var confirmDialog = document.querySelector('[data-confirm-dialog]');
  if (confirmDialog) {
    var confirmOpen = document.querySelector('[data-confirm-open]');
    var step2 = confirmDialog.querySelector('[data-confirm-step2]');
    var stepNo = confirmDialog.querySelector('.dlg__step');
    var firstActions = confirmDialog.querySelector('.dlg__actions');
    var armSwitch = confirmDialog.querySelector('[data-confirm-switch]');
    var finalBtn = confirmDialog.querySelector('[data-confirm-final]');
    var dialogStatus = function () { return liveEl('confirm'); };

    function resetDialog() {
      if (step2) { step2.hidden = true; }
      if (stepNo) { stepNo.textContent = state.lang === 'ko' ? '1단계 / 2' : 'Step 1 of 2'; stepNo.setAttribute('data-ko', '1단계 / 2'); stepNo.dataset.en = 'Step 1 of 2'; }
      if (firstActions) { firstActions.hidden = false; }
      if (armSwitch) { armSwitch.setAttribute('aria-checked', 'false'); }
      if (finalBtn) { finalBtn.disabled = true; }
    }
    if (confirmOpen) {
      confirmOpen.addEventListener('click', function () {
        resetDialog();
        S.tap();
        confirmDialog.showModal();
      });
    }
    confirmDialog.querySelectorAll('[data-confirm-cancel]').forEach(function (b) {
      b.addEventListener('click', function () {
        confirmDialog.close();
        S.down();
        setLive('confirm', t().confirmCancel);
        if (confirmOpen) { confirmOpen.focus(); }
      });
    });
    var nextBtn = confirmDialog.querySelector('[data-confirm-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (step2) { step2.hidden = false; }
        if (stepNo) { stepNo.textContent = state.lang === 'ko' ? '2단계 / 2' : 'Step 2 of 2'; stepNo.setAttribute('data-ko', '2단계 / 2'); stepNo.dataset.en = 'Step 2 of 2'; }
        if (firstActions) { firstActions.hidden = true; }
        S.tap();
        if (armSwitch) { armSwitch.focus(); }
      });
    }
    if (armSwitch) {
      armSwitch.addEventListener('click', function () {
        var on = armSwitch.getAttribute('aria-checked') !== 'true';
        armSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
        if (finalBtn) { finalBtn.disabled = !on; }
        S.tap();
      });
    }
    if (finalBtn) {
      finalBtn.addEventListener('click', function () {
        confirmDialog.close();
        S.down();
        setLive('confirm', t().confirmDone);
        if (confirmOpen) { confirmOpen.focus(); }
      });
    }
    confirmDialog.addEventListener('close', function () {
      var status = dialogStatus();
      if (status && !status.textContent) { status.textContent = t().confirmCancel; }
      resetDialog();
    });
  }

  /* ---------- 07 keypad ---------- */
  var keypad = document.querySelector('[data-kp-display]');
  if (keypad) {
    var kpValue = '';
    var renderKp = function () {
      keypad.textContent = kpValue ? new Array(kpValue.length + 1).join('\u2022') : '\u2014 \u2014 \u2014 \u2014';
      keypad.setAttribute('aria-label', t().digits(kpValue.length));
      setLive('keypad', t().digits(kpValue.length));
    };
    document.querySelectorAll('[data-kp]').forEach(function (key) {
      key.addEventListener('click', function () {
        var k = key.getAttribute('data-kp');
        if (k === 'clear') { kpValue = ''; S.down(); }
        else if (k === 'ok') {
          S.ok();
          setLive('keypad', t().keypadOk);
          return;
        } else if (kpValue.length < 6) { kpValue += k; S.tap(); }
        renderKp();
      });
    });
  }

  /* ---------- 08 banners ---------- */
  var bannerSlot = document.querySelector('[data-banner-slot]');
  if (bannerSlot) {
    var bannerTexts = {
      success: { en: ['Saved', 'Your appointment is confirmed for Thursday 2:30 PM.'], ko: ['저장했습니다', '목요일 오후 2시 30분 예약이 확정되었습니다.'] },
      error: { en: ['Not saved', 'The connection dropped. Your changes are still on this screen — try again.'], ko: ['저장하지 못했습니다', '연결이 끊겼습니다. 입력한 내용은 그대로 있으니 다시 시도해 주세요.'] },
      info: { en: ['Heads up', 'This kiosk closes at 6 PM today.'], ko: ['안내', '오늘 이 키오스크는 오후 6시에 닫습니다.'] }
    };
    var icons = { success: '#i-check', error: '#i-alert', info: '#i-info' };
    var makeBanner = function (kind) {
      var words = bannerTexts[kind][state.lang];
      var el = document.createElement('div');
      el.className = 'banner banner--' + kind;
      el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
      el.innerHTML = '<span class="banner__icon" aria-hidden="true"><svg class="ic"><use href="' + icons[kind] + '"/></svg></span>' +
        '<div><h4></h4><p></p></div>' +
        '<button class="banner__close" type="button" aria-label="' + (state.lang === 'ko' ? '닫기' : 'Close') + '"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button>';
      el.querySelector('h4').textContent = words[0];
      el.querySelector('p').textContent = words[1];
      el.querySelector('.banner__close').addEventListener('click', function () {
        el.remove();
        S.tap();
      });
      bannerSlot.innerHTML = '';
      bannerSlot.appendChild(el);
      if (kind === 'success') { S.ok(); } else if (kind === 'error') { S.err(); } else { S.nav(); }
    };
    document.querySelectorAll('[data-banner]').forEach(function (b) {
      b.addEventListener('click', function () { makeBanner(b.getAttribute('data-banner')); });
    });
  }

  /* ---------- 09 steps ---------- */
  var stepsBox = document.querySelector('[data-steps]');
  function stepsState() {
    if (!stepsBox) { return null; }
    var items = Array.prototype.slice.call(stepsBox.querySelectorAll('.steps__item'));
    var current = 0;
    items.forEach(function (it, i) { if (it.classList.contains('is-current')) { current = i; } });
    return { items: items, current: current };
  }
  function announceStep(st) {
    var nameEl = st.items[st.current].querySelector('.steps__name');
    var name = nameEl ? nameEl.textContent.trim() : '';
    setLive('steps', t().stepsLine(st.current + 1, st.items.length, name));
  }
  function renderSteps(st) {
    st.items.forEach(function (it, i) {
      it.classList.toggle('is-current', i === st.current);
      it.classList.toggle('is-done', i < st.current);
      if (i === st.current) { it.setAttribute('aria-current', 'step'); }
      else { it.removeAttribute('aria-current'); }
      var dot = it.querySelector('.steps__dot');
      if (dot) {
        if (i < st.current) {
          dot.textContent = '\u2713';
        } else {
          dot.textContent = String(i + 1);
        }
      }
    });
    var fill = stepsBox.querySelector('[data-steps-fill]');
    if (fill) { fill.style.width = ((st.current + 1) / st.items.length * 100) + '%'; }
    announceStep(st);
  }
  if (stepsBox) {
    renderSteps(stepsState());
    document.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var st = stepsState();
        if (!st) { return; }
        if (b.getAttribute('data-step') === 'next') {
          st.current = Math.min(st.items.length - 1, st.current + 1);
        } else {
          st.current = Math.max(0, st.current - 1);
        }
        renderSteps(st);
        S.nav();
      });
    });
  }

  /* ---------- 10 senior form ---------- */
  var seniorForm = document.querySelector('[data-senior-form]');
  if (seniorForm) {
    var nameInput = seniorForm.querySelector('#sf-name');
    var phoneInput = seniorForm.querySelector('#sf-phone');
    var dateInput = seniorForm.querySelector('#sf-date');
    var summary = seniorForm.querySelector('[data-form-summary]');
    var formStatus = seniorForm.querySelector('[data-form-status]');

    function setFieldError(input, msg) {
      var err = document.getElementById(input.id + '-err');
      if (!err) { return; }
      if (msg) {
        input.setAttribute('aria-invalid', 'true');
        err.hidden = false;
        err.textContent = msg;
      } else {
        input.removeAttribute('aria-invalid');
        err.hidden = true;
        err.textContent = '';
      }
    }
    function validate() {
      var out = [];
      if (!nameInput.value.trim()) {
        setFieldError(nameInput, t().formName);
        out.push([nameInput, t().formName]);
      } else { setFieldError(nameInput, ''); }
      var digits = phoneInput.value.replace(/[^0-9]/g, '');
      if (!phoneInput.value.trim()) {
        setFieldError(phoneInput, t().formPhone);
        out.push([phoneInput, t().formPhone]);
      } else if (digits.length < 9) {
        setFieldError(phoneInput, t().formPhoneBad);
        out.push([phoneInput, t().formPhoneBad]);
      } else { setFieldError(phoneInput, ''); }
      if (!dateInput.value) {
        setFieldError(dateInput, t().formDate);
        out.push([dateInput, t().formDate]);
      } else { setFieldError(dateInput, ''); }
      return out;
    }
    seniorForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = validate();
      if (formStatus) { formStatus.classList.remove('is-ok'); formStatus.textContent = ''; }
      if (problems.length) {
        summary.hidden = false;
        summary.innerHTML = '';
        var h = document.createElement('h4');
        h.textContent = t().formSummary(problems.length);
        var ul = document.createElement('ul');
        problems.forEach(function (pair) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + pair[0].id;
          a.textContent = pair[1];
          a.addEventListener('click', function (ev) {
            ev.preventDefault();
            pair[0].focus();
          });
          li.appendChild(a);
          ul.appendChild(li);
        });
        summary.appendChild(h);
        summary.appendChild(ul);
        summary.focus();
        S.err();
        return;
      }
      summary.hidden = true;
      summary.innerHTML = '';
      if (formStatus) {
        formStatus.textContent = t().formOk;
        formStatus.classList.add('is-ok');
      }
      S.ok();
    });
    [nameInput, phoneInput, dateInput].forEach(function (input) {
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') { setFieldError(input, ''); }
      });
    });
  }

  /* ---------- filters ---------- */
  var currentFilter = 'all';
  var filterStatus = document.querySelector('[data-filter-status]');
  function updateFilterStatus(filter) {
    if (!filterStatus) { return; }
    filterStatus.textContent = filter === 'free' ? t().filterFree : filter === 'pro' ? t().filterPro : t().filterAll;
  }
  document.querySelectorAll('[data-filter]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      currentFilter = f;
      document.querySelectorAll('[data-filter]').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      document.querySelectorAll('[data-cards] > .card').forEach(function (card) {
        var show = f === 'all' || card.getAttribute('data-tier') === f;
        card.hidden = !show;
      });
      updateFilterStatus(f);
      S.tap();
    });
  });
  updateFilterStatus('all');

  /* ---------- waitlist ---------- */
  var waitlist = document.getElementById('waitlist');
  var waitForm = document.querySelector('[data-waitlist-form]');
  var waitStatus = document.querySelector('[data-waitlist-status]');
  var waitSubmit = document.querySelector('[data-waitlist-submit]');

  function openWaitlist(plan) {
    if (!waitlist) { return; }
    var sel = document.getElementById('wl-plan');
    if (sel && (plan === 'pro' || plan === 'founding' || plan === 'undecided')) { sel.value = plan; }
    if (waitStatus) { waitStatus.textContent = ''; waitStatus.classList.remove('is-err'); }
    if (!waitlist.open) { waitlist.showModal(); }
    S.tap();
    var email = document.getElementById('wl-email');
    if (email) { setTimeout(function () { email.focus(); }, 40); }
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-waitlist]');
    if (opener) {
      e.preventDefault();
      openWaitlist(opener.getAttribute('data-plan'));
      return;
    }
    if (e.target.closest('[data-close-waitlist]')) {
      e.preventDefault();
      if (waitlist) { waitlist.close(); }
    }
  });
  if (waitlist) {
    waitlist.addEventListener('click', function (e) {
      var r = waitlist.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        waitlist.close();
      }
    });
  }
  if (waitForm) {
    waitForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('wl-email');
      var emailErr = document.getElementById('wl-email-err');
      var value = email.value.trim();
      function fail(msg) {
        waitStatus.textContent = msg;
        waitStatus.classList.add('is-err');
        email.setAttribute('aria-invalid', 'true');
        emailErr.hidden = false;
        emailErr.textContent = msg;
        email.focus();
        S.err();
      }
      emailErr.hidden = true;
      email.removeAttribute('aria-invalid');
      if (!value) { fail(t().emailEmpty); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { fail(t().emailBad); return; }

      var role = document.getElementById('wl-role');
      var planSel = document.getElementById('wl-plan');
      var updates = waitForm.querySelector('input[name="updates"]');
      waitStatus.classList.remove('is-err');
      waitStatus.textContent = t().sending;
      waitSubmit.disabled = true;
      S.tap();

      var payload = {
        email: value,
        role: role ? role.value : '',
        plan: planSel ? planSel.value : '',
        plan_label: planSel ? planSel.options[planSel.selectedIndex].textContent.trim() : '',
        updates: updates && updates.checked ? 'yes' : 'no',
        product: 'a11y-ui-kit',
        _subject: 'A11yKit — Pro early access request',
        _template: 'table',
        _captcha: 'false'
      };

      fetch('https://formsubmit.co/ajax/0e95d93c687b1b0b2346af06319b0a58', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          var ok = res.ok && (body.success === 'true' || body.success === true);
          if (!ok) { throw new Error('http ' + res.status); }
          waitStatus.textContent = t().sent;
          waitStatus.classList.remove('is-err');
          waitSubmit.disabled = true;
          waitSubmit.querySelector('span').textContent = state.lang === 'ko' ? '등록 완료' : 'You are on the list';
          S.ok();
        });
      }).catch(function () {
        waitStatus.textContent = t().sendFail;
        waitStatus.classList.add('is-err');
        waitSubmit.disabled = false;
        S.err();
      });
    });
  }

  /* ---------- keyboard: Escape returns focus ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && waitlist && waitlist.open) { waitlist.close(); }
  });

  /* ---------- init ---------- */
  captureI18n();
  applyTextsize();
  applySound();
  applyContrast();
  applyLang();
})();
