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

  var storedLang = store.get('a11ykit.lang');
  var browserLang = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : '').toLowerCase();
  var state = {
    lang: storedLang === 'ko' || storedLang === 'en' ? storedLang : (browserLang.indexOf('ko') === 0 ? 'ko' : 'en'),
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
      hireSent: 'Sent. A reply follows by email, usually within one business day.',
      hireFail: 'Could not send. Try again, or write to doggonug@gmail.com.',
      close: 'Close',
      soundOn: 'On',
      soundOff: 'Off',
      muted: 'Sound cues off',
      hcOn: 'On',
      hcOff: 'Off',
      ruleCopied: 'Rule file copied',
      ruleSaved: 'Saved',
      builderSummary: function (n, free, pro) {
        return n + ' components for this screen · ' + free + ' free' + (pro ? ' · ' + pro + ' Pro' : '') + '.';
      },
      builderNoTarget: 'Choose a user group to put its constraints into the prompt.',
      builderCopied: 'Prompt copied',
      builderSaved: 'Prompt saved as a .md file'
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
      hireSent: '접수했습니다. 보통 영업일 1일 안에 메일로 회신드립니다.',
      hireFail: '보내지 못했습니다. 다시 시도하시거나 doggonug@gmail.com 으로 보내 주세요.',
      close: '닫기',
      soundOn: '켜짐',
      soundOff: '꺼짐',
      muted: '소리 안내를 껐습니다',
      hcOn: '켜짐',
      hcOff: '꺼짐',
      ruleCopied: '룰 파일을 복사했습니다',
      ruleSaved: '저장했습니다',
      builderSummary: function (n, free, pro) {
        return '이 화면에 컴포넌트 ' + n + '개 · 무료 ' + free + (pro ? ' · Pro ' + pro : '') + '개.';
      },
      builderNoTarget: '사용자군을 고르면 그 제약이 프롬프트에 들어갑니다.',
      builderCopied: '프롬프트를 복사했습니다',
      builderSaved: '프롬프트 파일(.md)로 저장했습니다'
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
    if (typeof renderBuilder === 'function') { renderBuilder(); }
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

  /* ---------- hire / quote request ---------- */
  var hire = document.getElementById('hireDialog');
  var hireForm = document.querySelector('[data-hire-form]');
  var hireStatus = document.querySelector('[data-hire-status]');
  var hireSubmit = document.querySelector('[data-hire-submit]');
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/0e95d93c687b1b0b2346af06319b0a58';

  function openHire(kind) {
    if (!hire) { return; }
    var sel = document.getElementById('hq-kind');
    if (sel && kind) {
      var match = Array.prototype.some.call(sel.options, function (o) { return o.value === kind; });
      if (match) { sel.value = kind; }
    }
    if (hireStatus) { hireStatus.textContent = ''; hireStatus.classList.remove('is-err'); }
    if (hireSubmit) { hireSubmit.disabled = false; }
    if (!hire.open) { hire.showModal(); }
    S.tap();
    var name = document.getElementById('hq-name');
    if (name) { setTimeout(function () { name.focus(); }, 40); }
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-hire]');
    if (opener) {
      e.preventDefault();
      openHire(opener.getAttribute('data-type'));
      return;
    }
    if (e.target.closest('[data-close-hire]')) {
      e.preventDefault();
      if (hire) { hire.close(); }
    }
  });
  if (hire) {
    hire.addEventListener('click', function (e) {
      var r = hire.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        hire.close();
      }
    });
  }
  if (hireForm) {
    hireForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('hq-email');
      var emailErr = document.getElementById('hq-email-err');
      var nameField = document.getElementById('hq-name');
      var value = email.value.trim();
      function fail(msg) {
        hireStatus.textContent = msg;
        hireStatus.classList.add('is-err');
        email.setAttribute('aria-invalid', 'true');
        emailErr.hidden = false;
        emailErr.textContent = msg;
        email.focus();
        S.err();
      }
      emailErr.hidden = true;
      email.removeAttribute('aria-invalid');
      if (!nameField.value.trim()) { hireStatus.textContent = t().formName; hireStatus.classList.add('is-err'); nameField.focus(); S.err(); return; }
      if (!value) { fail(t().emailEmpty); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { fail(t().emailBad); return; }

      var kindSel = document.getElementById('hq-kind');
      var org = document.getElementById('hq-org');
      var msg = document.getElementById('hq-msg');
      var budgetSel = document.getElementById('hq-budget');
      var whenSel = document.getElementById('hq-when');
      var formatSel = document.getElementById('hq-format');
      function pick(sel) {
        if (!sel) { return ''; }
        return sel.value + ' (' + (sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent.trim() : '') + ')';
      }
      hireStatus.classList.remove('is-err');
      hireStatus.textContent = t().sending;
      hireSubmit.disabled = true;
      S.tap();

      var payload = {
        name: nameField.value.trim(),
        email: value,
        org: org ? org.value.trim() : '',
        kind: kindSel ? kindSel.value : '',
        kind_label: kindSel ? kindSel.options[kindSel.selectedIndex].textContent.trim() : '',
        budget: pick(budgetSel),
        timeline: pick(whenSel),
        deliverable: pick(formatSel),
        message: msg ? msg.value.trim() : '',
        product: 'a11y-ui-kit',
        _subject: 'A11yKit — 견적·도입 문의 (24시간 회신)',
        _template: 'table',
        _captcha: 'false'
      };

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          var ok = res.ok && (body.success === 'true' || body.success === true);
          if (!ok) { throw new Error('http ' + res.status); }
          hireStatus.textContent = t().hireSent;
          hireStatus.classList.remove('is-err');
          hireSubmit.disabled = true;
          hireSubmit.querySelector('span').textContent = state.lang === 'ko' ? '접수 완료' : 'Sent';
          S.ok();
        });
      }).catch(function () {
        hireStatus.textContent = t().hireFail;
        hireStatus.classList.add('is-err');
        hireSubmit.disabled = false;
        S.err();
      });
    });
  }

  /* ---------- tabs (rule pack + MCP clients) ---------- */
  function initTabs() {
    document.querySelectorAll('[role="tablist"][data-tabs]').forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      if (!tabs.length) { return; }
      function panelOf(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }
      function select(tab, moveFocus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          var panel = panelOf(t);
          if (panel) { panel.hidden = !on; }
        });
        if (moveFocus) { tab.focus(); }
        if (list.getAttribute('data-tabs') === 'rules') { ensureRules(); }
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab, false); S.tap(); });
        tab.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { next = (i + 1) % tabs.length; }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { next = (i - 1 + tabs.length) % tabs.length; }
          else if (e.key === 'Home') { next = 0; }
          else if (e.key === 'End') { next = tabs.length - 1; }
          if (next !== null) {
            e.preventDefault();
            select(tabs[next], true);
            S.tap();
          }
        });
      });
    });
  }

  /* ---------- AI rules pack ---------- */
  var rulesPromise = null;
  var RULE_FILES = {
    cursor: 'a11y-senior-ui.mdc',
    'claude-code': 'CLAUDE.md',
    windsurf: 'windsurfrules.txt',
    copilot: 'copilot-instructions.md',
    agents: 'AGENTS.md'
  };
  function ruleStatus(msg, kind) {
    var el = document.querySelector('[data-rule-status]');
    if (!el) { return; }
    el.textContent = msg;
    el.classList.remove('is-ok', 'is-err');
    if (kind) { el.classList.add(kind === 'ok' ? 'is-ok' : 'is-err'); }
  }
  function ensureRules() {
    if (!rulesPromise) {
      rulesPromise = fetch('ai-rules.json').then(function (r) {
        if (!r.ok) { throw new Error('rules ' + r.status); }
        return r.json();
      }).then(function (data) {
        Object.keys(data.packs || {}).forEach(function (key) {
          var body = document.querySelector('[data-rule-body="' + key + '"]');
          if (body) { body.textContent = data.packs[key].body; }
        });
        return data;
      }).catch(function (err) {
        ruleStatus(state.lang === 'ko'
          ? '룰 파일을 불러오지 못했습니다. GitHub의 rules 폴더에서 바로 볼 수 있습니다.'
          : 'The rule files did not load. They are readable in the rules folder on GitHub.', 'err');
        throw err;
      });
    }
    return rulesPromise;
  }
  function downloadText(filename, text) {
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return true;
    } catch (err) { return false; }
  }
  document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('[data-rule-copy]');
    if (copyBtn) {
      e.preventDefault();
      var id = copyBtn.getAttribute('data-rule-copy');
      ensureRules().then(function (data) {
        var pack = data.packs[id];
        if (!pack) { throw new Error('missing pack'); }
        return writeClipboard(pack.body).then(function () {
          ruleStatus(t().ruleCopied, 'ok');
          toast(t().ruleCopied + ' · ' + pack.target);
          S.ok();
        });
      }).catch(function () { S.err(); });
      return;
    }
    var dlBtn = e.target.closest('[data-rule-download]');
    if (dlBtn) {
      e.preventDefault();
      var dlId = dlBtn.getAttribute('data-rule-download');
      ensureRules().then(function (data) {
        var pack = data.packs[dlId];
        if (!pack) { throw new Error('missing pack'); }
        var name = RULE_FILES[dlId] || (dlId + '.md');
        if (downloadText(name, pack.body)) {
          ruleStatus(t().ruleSaved + ' ' + name, 'ok');
          toast(t().ruleSaved);
          S.ok();
        } else {
          ruleStatus(t().copyFail, 'err');
          S.err();
        }
      }).catch(function () { S.err(); });
    }
  });

  /* ---------- screen + target prompt builder ---------- */
  var BUILDER_SCREENS = {
    'kiosk-order': {
      ko: '키오스크 주문·발권', en: 'Kiosk ordering or ticketing',
      koGoal: '매장 입구나 창구에서 5초 안에 메뉴를 고르고 결제까지 끝내는 무인 주문·발권 화면',
      enGoal: 'an unattended ordering or ticketing screen where a choice is made in about five seconds and payment finishes without staff',
      free: ['kiosk-choice-list', 'big-action-button', 'number-keypad', 'status-banner', 'step-progress', 'confirm-switch'],
      pro: []
    },
    welfare: {
      ko: '복지·민원 신청', en: 'Welfare or civil application',
      koGoal: '읽고 쓰는 부담이 큰 신청서를 단계별로 채우고 마지막에 한 번 더 확인하는 화면',
      enGoal: 'a staged application form for people who find reading and typing hard, with one deliberate review before submitting',
      free: ['step-progress', 'senior-form', 'status-banner', 'text-scale-switch', 'confirm-switch', 'read-aloud'],
      pro: []
    },
    hospital: {
      ko: '병원 예약·접수', en: 'Hospital booking or reception',
      koGoal: '증상을 고르고 진료 시간을 확인해 접수하는 병원 예약·현장 접수 화면',
      enGoal: 'a booking and check-in screen where a patient picks a reason, sees doctor and room, and confirms a time',
      free: ['step-progress', 'senior-form', 'kiosk-choice-list', 'big-action-button', 'status-banner', 'read-aloud'],
      pro: ['hospital-timeslot']
    },
    commerce: {
      ko: '시니어 커머스·결제', en: 'Senior commerce and payment',
      koGoal: '상품을 고르고 금액을 소리로 확인한 뒤 결제하는 시니어용 구매 화면',
      enGoal: 'a purchase flow for older buyers: choose, hear the amount read aloud, then confirm the payment',
      free: ['big-action-button', 'kiosk-choice-list', 'confirm-switch', 'text-scale-switch', 'status-banner'],
      pro: ['hold-to-pay', 'large-receipt']
    },
    care: {
      ko: '요양·복약 기록', en: 'Care and medication record',
      koGoal: '요양보호사와 가족이 복약·활력징후를 큰 글씨로 확인하고 기록하는 화면',
      enGoal: 'a care screen where a caregiver and family read medication and vitals in large type and record them with one tap',
      free: ['medication-card', 'text-scale-switch', 'status-banner', 'read-aloud'],
      pro: ['vitals-trend', 'memory-gallery']
    },
    banking: {
      ko: '은행 ATM·앱', en: 'Banking: ATM or app',
      koGoal: '금액을 직접 입력하고 확인 후 이체하는 금융 단말·앱 화면',
      enGoal: 'a banking screen where an amount is typed on a large keypad and a transfer is confirmed with a deliberate second step',
      free: ['number-keypad', 'kiosk-choice-list', 'big-action-button', 'status-banner', 'confirm-switch', 'read-aloud'],
      pro: []
    }
  };
  var BUILDER_TARGETS = {
    senior70: {
      ko: '70대 이상 고령 사용자', en: 'users aged 70 and over',
      koRule: '본문 19px 이상, 줄 간격 1.6. 한 화면에 결정 하나. 전문용어 대신 쉬운 말로, 버튼 글자는 동사로 시작한다(예: "예약하기").',
      enRule: 'body 19px or larger with 1.6 line height; one decision per screen; plain words, not jargon; button labels start with a verb.'
    },
    lowvision: {
      ko: '저시력·백내장 사용자', en: 'users with low vision or cataracts',
      koRule: '본문 대비 18:1 수준, 보조문도 10:1 이상. 글자 크기 3단계(100/125/150%)와 고대비 모드를 제공하고 선택을 저장한다. 정보를 아이콘만으로 전달하지 않는다.',
      enRule: 'body contrast near 18:1 and secondary text above 10:1; offer three text sizes (100/125/150%) and a high-contrast mode, and remember the choice; never carry meaning in an icon alone.'
    },
    tremor: {
      ko: '손 떨림·터치 미숙 사용자', en: 'users with a tremor or uncertain touch',
      koRule: '타깃 56px 이상, 간격 12px 이상, 실수로 눌러도 되돌릴 수 있게. 파괴적 동작은 길게 누르기나 2단계 확인으로 막는다. 스와이프·드래그에만 있는 기능을 만들지 않는다.',
      enRule: 'targets 56px or larger with 12px or more between them, and every mis-tap reversible; destructive actions need a hold or a two-step confirm; never put a function only on swipe or drag.'
    },
    hearing: {
      ko: '난청 사용자', en: 'users with hearing loss',
      koRule: '소리로만 알리는 정보 금지. 음성 안내는 화면 글자와 낭독기 알림으로 반드시 함께 전달한다. 소리 끄기 스위치를 두고 선택을 기억한다.',
      enRule: 'no information carried by sound alone; every audio cue also appears as text and a screen-reader announcement; provide a mute switch that remembers the choice.'
    },
    cognitive: {
      ko: '인지 지원이 필요한 사용자', en: 'users who need cognitive support',
      koRule: '한 번에 한 단계, 진행 위치를 항상 숫자와 이름으로 보여준다(aria-current). 입력 내용은 되돌아가 수정할 수 있게 하고, 오류는 무엇을 어떻게 고칠지 문장으로 쓴다.',
      enRule: 'one step at a time with the position always in numbers and words (aria-current); let people go back and edit; write errors as sentences that say what to fix and how.'
    }
  };
  var COMBO_FALLBACK = {
    'big-action-button': { ko: '큰 동작 버튼 + 합성 탭 사운드', en: 'Big action buttons + tap sound' },
    'text-scale-switch': { ko: '글자 크기 3단계 · 고대비 스위치', en: 'Text scale + contrast switch' },
    'medication-card': { ko: '큰 글씨 복약 체크 카드', en: 'Medication checklist' },
    'kiosk-choice-list': { ko: '키오스크 1열 대형 선택', en: 'Kiosk choice list' },
    'read-aloud': { ko: '음성 읽어주기 버튼', en: 'Read aloud button' },
    'confirm-switch': { ko: '2단계 확인 · 슬라이드 스위치', en: 'Two-step confirm switch' },
    'number-keypad': { ko: '대형 숫자 키패드', en: 'Big number keypad' },
    'status-banner': { ko: '오류 · 성공 안내 배너', en: 'Success and error banners' },
    'step-progress': { ko: '대형 단계 진행 표시', en: 'Step progress' },
    'senior-form': { ko: '시니어 친화 입력 폼', en: 'Senior-friendly form' },
    'voice-search': { ko: '음성 인식 검색바', en: 'Voice search bar' },
    'family-checkin': { ko: '가족 안부 확인 카드', en: 'Family check-in card' },
    'hospital-timeslot': { ko: '병원 예약 타임슬롯', en: 'Hospital timeslots' },
    'large-receipt': { ko: '큰 글씨 영수증 인쇄 뷰', en: 'Large-print receipt' },
    'tts-phrase-pack': { ko: '다국어 음성 안내 팩', en: 'Multilingual TTS pack' },
    'memory-gallery': { ko: '회상 갤러리', en: 'Reminiscence gallery' },
    'vitals-trend': { ko: '큰 글씨 활력징후 추이', en: 'Vitals trend' },
    'hold-to-pay': { ko: '길게 눌러 결제', en: 'Hold to pay' }
  };
  var catalogCache = null;
  var catalogAsked = false;
  function loadCatalogForBuilder() {
    if (catalogAsked) { return; }
    catalogAsked = true;
    loadCatalog().then(function (data) { catalogCache = data; renderBuilder(); }).catch(function () {});
  }

  function builderInputs() {
    var screenSel = document.querySelector('[data-builder-screen]');
    var langSel = document.querySelector('[data-builder-lang]');
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-builder-target]:checked')).map(function (c) { return c.value; });
    return {
      screen: screenSel ? screenSel.value : 'kiosk-order',
      lang: langSel ? langSel.value : 'ko',
      targets: targets
    };
  }
  function compInfo(id, lang) {
    var item = catalogCache && catalogCache.components ? catalogCache.components[id] : null;
    if (item) {
      return {
        name: (item.name && (item.name[lang] || item.name.en)) || id,
        tier: item.tier,
        summary: (item.summary && (item.summary[lang] || item.summary.en)) || ''
      };
    }
    var fb = COMBO_FALLBACK[id];
    return { name: fb ? (fb[lang] || fb.en) : id, tier: 'free', summary: '' };
  }
  function firstSentence(text, max) {
    if (!text) { return ''; }
    var cut = text.split(/(?<=[.!?。])\s/)[0] || text;
    if (cut.length > (max || 150)) { cut = cut.slice(0, (max || 150) - 1).trim() + '…'; }
    return cut;
  }
  function buildPromptKo(screen, targets, lang) {
    var sc = BUILDER_SCREENS[screen] || BUILDER_SCREENS['kiosk-order'];
    var all = sc.free.concat(sc.pro || []);
    var lines = [];
    lines.push('# 화면: ' + sc.ko);
    lines.push('');
    lines.push('## 무엇을 만드나');
    lines.push('한국어 ' + sc.koGoal + '. 아래 규칙과 컴포넌트를 그대로 써서 HTML·CSS·바닐라 JS 한 벌로 만들어 주세요. 프레임워크·번들러·CDN·외부 요청은 넣지 않습니다.');
    lines.push('');
    lines.push('## 누가 쓰나 (이 제약이 디자인을 결정합니다)');
    if (!targets.length) {
      lines.push('- 일반 성인 사용자 (사용자군을 선택하지 않았습니다. 가능하면 위쪽 빌더에서 타깃을 골라 다시 생성하세요.)');
    } else {
      targets.forEach(function (k) {
        var tg = BUILDER_TARGETS[k];
        if (tg) { lines.push('- ' + tg.ko + ': ' + tg.koRule); }
      });
    }
    lines.push('');
    lines.push('## 반드시 지킬 규칙 (WCAG 2.2 AA 최소, 대비·타깃·포커스는 AAA)');
    lines.push('- 모든 조작 요소 48px 이상, 주요 동작 56–64px, 인접 간격 12px 이상. 확대는 padding으로, transform: scale() 금지.');
    lines.push('- 본문 대비 7:1 이상(AAA). 기준값 #F3F6F9 / #06090F = 18.4:1, 보조문 4.5:1 이상.');
    lines.push('- 포커스 링 4px #FFE066, 3px 오프셋, :focus-visible에서만, overflow에 잘리지 않게.');
    lines.push('- 상태를 색으로만 알리지 않기: 아이콘·단어·굵기·밑줄을 함께.');
    lines.push('- 상태 변화는 role="status" aria-live="polite", 오류만 role="alert". 포커스를 옮기지 않는다.');
    lines.push('- 실제 button·a·input·select·dialog 사용. 라벨은 입력칸 위에 for/id로 연결, 플레이스홀더는 라벨이 아님.');
    lines.push('- 한국어: word-break: keep-all. 200% 확대와 320px 폭에서 가로 스크롤 없이 동작.');
    lines.push('- prefers-reduced-motion 존중, 메시지가 나타나도 레이아웃이 밀리지 않게 min-height 확보.');
    lines.push('- 소리는 선택 사항: Web Audio 합성만, 80ms에 1회, 끄기 스위치와 선택 저장, 모든 소리는 글자로도 전달.');
    lines.push('');
    lines.push('## 쓸 컴포넌트 (A11yKit)');
    all.forEach(function (id, i) {
      var info = compInfo(id, 'ko');
      var note = info.summary ? ' — ' + firstSentence(info.summary, 130) : '';
      var pro = info.tier === 'pro' ? ' [Pro — 코드 대신 스펙을 참고해 같은 동작을 직접 구현]' : '';
      lines.push((i + 1) + '. ' + info.name + ' (' + id + ')' + note + pro);
    });
    lines.push('');
    lines.push('## 하지 말 것');
    lines.push('- div에 click만 붙인 버튼, 플레이스홀더만 있는 입력칸, outline:none, 색만으로 성공/오류 구분.');
    lines.push('- 자동 재생 오디오, 파일 기반 효과음, 외부 아이콘 폰트, 추적 스크립트.');
    lines.push('- 한 화면에 결정 여러 개, 의미 없는 애니메이션.');
    lines.push('');
    lines.push('## 완료 기준');
    lines.push('- Tab·Shift+Tab·방향키·Space·Enter·Escape만으로 전체 흐름 완주.');
    lines.push('- 화면 낭독기로 이름·역할·상태·안내 문구 확인.');
    lines.push('- 200% 확대와 320px 폭에서 가로 스크롤·잘림 없음, 대비 측정 완료, 콘솔 오류 0, 실패한 요청 0.');
    lines.push('- 마지막에 재사용한 A11yKit 컴포넌트 id를 목록으로 보고.');
    lines.push('');
    lines.push('## 참고');
    lines.push('- 무료 10종 소스와 데모: https://doggonug-cpu.github.io/a11y-ui-kit/#components');
    lines.push('- 에이전트용 규칙 파일: https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt');
    lines.push('- MCP가 연결되어 있다면 list_components → get_component → check_wcag_checklist 순서로 확인.');
    return lines.join('\n');
  }
  function buildPromptEn(screen) {
    var sc = BUILDER_SCREENS[screen] || BUILDER_SCREENS['kiosk-order'];
    var inputs = builderInputs();
    var targets = inputs.targets;
    var all = sc.free.concat(sc.pro || []);
    var lines = [];
    lines.push('# Screen: ' + sc.en);
    lines.push('');
    lines.push('## What to build');
    lines.push('Build ' + sc.enGoal + '. Use the rules and components below, as one set of HTML, CSS and vanilla JS. No framework, bundler, CDN or external request.');
    lines.push('');
    lines.push('## Who uses it (these constraints decide the design)');
    if (!targets.length) {
      lines.push('- General adult users (no target group selected; choose one in the builder above to regenerate).');
    } else {
      targets.forEach(function (k) {
        var tg = BUILDER_TARGETS[k];
        if (tg) { lines.push('- ' + tg.en + ': ' + tg.enRule); }
      });
    }
    lines.push('');
    lines.push('## Non-negotiable rules (WCAG 2.2 AA floor; contrast, targets and focus to AAA)');
    lines.push('- Every target 48x48 CSS px or larger, primary actions 56-64px, 12px or more apart. Grow with padding, never transform: scale().');
    lines.push('- Body contrast 7:1 or better (AAA). Reference #F3F6F9 on #06090F = 18.4:1; secondary text above 4.5:1.');
    lines.push('- Focus ring 4px #FFE066, 3px offset, :focus-visible only, never clipped by overflow.');
    lines.push('- State is never colour-only: icon, word, weight or underline joins the colour.');
    lines.push('- Status changes go to role="status" aria-live="polite"; only errors use role="alert"; never move focus.');
    lines.push('- Real button, a, input, select and dialog. Labels above fields tied with for/id; a placeholder is never a label.');
    lines.push('- Korean text: word-break: keep-all. Works at 200% zoom and 320px width with no horizontal scroll.');
    lines.push('- Respect prefers-reduced-motion; reserve min-height so messages never shift layout.');
    lines.push('- Sound is optional: Web Audio tones only, one per 80ms at most, a mute switch that persists, every cue also in text.');
    lines.push('');
    lines.push('## Components to use (A11yKit)');
    all.forEach(function (id, i) {
      var info = compInfo(id, 'en');
      var note = info.summary ? ' — ' + firstSentence(info.summary, 150) : '';
      var pro = info.tier === 'pro' ? ' [Pro — implement the same behaviour from the spec; source is paid]' : '';
      lines.push((i + 1) + '. ' + info.name + ' (' + id + ')' + note + pro);
    });
    lines.push('');
    lines.push('## Do not');
    lines.push('- Put a click handler on a div, use placeholder-only labels, write outline:none, or signal success/error by colour alone.');
    lines.push('- Autoplay audio, use audio files, load an external icon font, or add a tracking script.');
    lines.push('- Put several decisions on one screen or animate without meaning.');
    lines.push('');
    lines.push('## Done means');
    lines.push('- The whole flow completes with Tab, Shift+Tab, arrows, Space, Enter and Escape only.');
    lines.push('- A screen reader reports names, roles, states and announcements.');
    lines.push('- 200% zoom and 320px width with no horizontal scroll or clipping, measured contrast, zero console errors, zero failed requests.');
    lines.push('- Finish by listing the A11yKit component ids you reused.');
    lines.push('');
    lines.push('## Reference');
    lines.push('- Free source and live demos: https://doggonug-cpu.github.io/a11y-ui-kit/#components');
    lines.push('- Agent index: https://doggonug-cpu.github.io/a11y-ui-kit/llms.txt');
    lines.push('- With MCP connected: list_components -> get_component -> check_wcag_checklist.');
    return lines.join('\n');
  }

  var builderPromptText = '';
  function renderBuilder() {
    var chipsBox = document.querySelector('[data-builder-chips]');
    if (!chipsBox) { return; }
    var inputs = builderInputs();
    var sc = BUILDER_SCREENS[inputs.screen] || BUILDER_SCREENS['kiosk-order'];
    var all = sc.free.concat(sc.pro || []);
    var freeCount = 0;
    var proCount = 0;
    chipsBox.innerHTML = '';
    all.forEach(function (id, i) {
      var info = compInfo(id, state.lang);
      if (info.tier === 'pro') { proCount += 1; } else { freeCount += 1; }
      var li = document.createElement('li');
      var n = document.createElement('span');
      n.className = 'combolist__n';
      n.textContent = String(i + 1).padStart(2, '0');
      var name = document.createElement(info.tier === 'pro' ? 'span' : 'a');
      name.className = 'combolist__name';
      if (name.tagName === 'A') { name.href = '#c-' + id; }
      name.textContent = info.name;
      var badge = document.createElement('span');
      var isPro = info.tier === 'pro';
      badge.className = 'badge ' + (isPro ? 'badge--pro' : 'badge--free');
      badge.textContent = isPro ? 'Pro' : 'Free';
      li.appendChild(n);
      li.appendChild(name);
      li.appendChild(badge);
      chipsBox.appendChild(li);
    });
    var summary = document.querySelector('[data-builder-summary]');
    if (summary) {
      var base = t().builderSummary(all.length, freeCount, proCount);
      summary.textContent = inputs.targets.length ? base : base + ' ' + t().builderNoTarget;
    }
    builderPromptText = inputs.lang === 'en' ? buildPromptEn(inputs.screen) : buildPromptKo(inputs.screen, inputs.targets, inputs.lang);
    var pre = document.querySelector('[data-builder-prompt]');
    if (pre) { pre.textContent = builderPromptText; }
  }
  function initBuilder() {
    var screenSel = document.querySelector('[data-builder-screen]');
    var langSel = document.querySelector('[data-builder-lang]');
    if (!screenSel) { return; }
    if (langSel) { langSel.value = state.lang === 'en' ? 'en' : 'ko'; }
    screenSel.addEventListener('change', function () { renderBuilder(); S.tap(); });
    if (langSel) { langSel.addEventListener('change', function () { renderBuilder(); S.tap(); }); }
    document.querySelectorAll('[data-builder-target]').forEach(function (box) {
      box.addEventListener('change', function () { renderBuilder(); S.tap(); });
    });
    var form = document.querySelector('[data-builder-form]');
    if (form) { form.addEventListener('submit', function (e) { e.preventDefault(); }); }
    document.addEventListener('click', function (e) {
      var copy = e.target.closest('[data-builder-copy]');
      if (copy) {
        e.preventDefault();
        writeClipboard(builderPromptText).then(function () {
          toast(t().builderCopied); S.ok();
        }).catch(function () { toast(t().copyFail); S.err(); });
        return;
      }
      var save = e.target.closest('[data-builder-download]');
      if (save) {
        e.preventDefault();
        var name = 'a11y-prompt-' + builderInputs().screen + '.md';
        if (downloadText(name, builderPromptText)) { toast(t().builderSaved); S.ok(); }
        else { toast(t().copyFail); S.err(); }
      }
    });
    var section = document.getElementById('builder');
    if (section && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { loadCatalogForBuilder(); io.disconnect(); }
        });
      }, { rootMargin: '300px' });
      io.observe(section);
    } else {
      loadCatalogForBuilder();
    }
    renderBuilder();
  }

  /* ---------- keyboard: Escape returns focus ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (waitlist && waitlist.open) { waitlist.close(); }
      if (hire && hire.open) { hire.close(); }
    }
  });

  /* ---------- init ---------- */
  initTabs();
  initBuilder();
  captureI18n();
  applyTextsize();
  applySound();
  applyContrast();
  applyLang();
  var rulesSection = document.getElementById('ai-rules');
  if (rulesSection && 'IntersectionObserver' in window) {
    var rulesIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          ensureRules().catch(function () {});
          rulesIo.disconnect();
        }
      });
    }, { rootMargin: '400px' });
    rulesIo.observe(rulesSection);
  } else {
    ensureRules().catch(function () {});
  }
})();
