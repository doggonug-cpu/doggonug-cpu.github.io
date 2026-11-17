/* 한울에듀테크 · 체험 키트 페이지
   - 40분 흐름 탭
   - 자료 소식 신청 폼 (FormSubmit AJAX)
   - 헤더 그림자 / 스크롤 등장
*/
(function () {
  'use strict';

  /* ---------- 1. 40분 흐름 탭 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tl-step'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tl-panel'));

  function selectTab(index, focus) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    if (focus && tabs[index]) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(i, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- 2. 헤더 테두리 ---------- */
  var head = document.querySelector('.site-head');
  var onScroll = function () {
    if (!head) return;
    head.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 등장 애니메이션 ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.card, .kit-list li, .shots figure, .road-item, .price');
  if (!reduce && 'IntersectionObserver' in window) {
    targets.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity .5s ease, transform .5s ease';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.slice.call(el.parentNode.children);
        var delay = Math.min(siblings.indexOf(el), 5) * 60;
        window.setTimeout(function () {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. 자료 소식 신청 ---------- */
  var form = document.getElementById('signup');
  if (!form) return;

  var msg = document.getElementById('form-msg');
  var submit = form.querySelector('button[type="submit"]');
  var endpoint = form.getAttribute('action');
  var label = submit.textContent;

  function say(text, kind) {
    msg.textContent = text;
    msg.className = 'form-note' + (kind ? ' ' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = form.elements.email;
    var agree = form.elements['동의'];
    if (!email.value || !email.checkValidity()) {
      say('이메일 주소를 확인해 주세요.', 'err');
      email.focus();
      return;
    }
    if (!agree.checked) {
      say('자료 소식 수신에 동의해 주세요.', 'err');
      agree.focus();
      return;
    }

  var data = new URLSearchParams();
  new FormData(form).forEach(function (value, key) {
    if (key === '_honey' || key === '동의' || key === '_captcha') return;
    data.append(key, value);
  });
  data.append('동의', '자료 소식 수신 동의함');
  data.append('_captcha', 'false');

  submit.disabled = true;
  submit.textContent = '보내는 중…';
  say('');

  // JSON 본문은 CORS 사전요청(OPTIONS)을 만들어 멈추는 일이 있어,
  // 사전요청이 없는 form-urlencoded 로 보낸다. 응답이 늦으면 실패로 처리한다.
  var timer = null;
  var guard = new Promise(function (_, reject) {
    timer = window.setTimeout(function () { reject(new Error('timeout')); }, 12000);
  });

  Promise.race([
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data
    }).then(function (res) {
      return res.json().catch(function () { return {}; });
    }),
    guard
  ])
    .then(function (result) {
      window.clearTimeout(timer);
      var accepted = result && (result.success === 'true' || result.success === true);
      if (!accepted) throw new Error('not accepted');
      form.reset();
      say('신청되었습니다. 새 자료가 나올 때만 보내드리겠습니다. 무료 키트와 4차시 전체 목차는 위에서 바로 받으실 수 있습니다.', 'ok');
      submit.textContent = '신청 완료';
      window.setTimeout(function () {
        submit.disabled = false;
        submit.textContent = label;
      }, 4000);
    })
    .catch(function () {
      window.clearTimeout(timer);
      say('지금은 신청을 받지 못했습니다. 잠시 뒤 다시 시도하시거나, 무료 키트는 위에서 바로 받아 쓰셔도 됩니다.', 'err');
      submit.disabled = false;
      submit.textContent = label;
    });
  });
})();
