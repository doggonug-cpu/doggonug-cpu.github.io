/* MarginCalc — 문의 폼(FormSubmit) 전송. 계산기와 분리해 어느 페이지에서든 동작합니다. */
(function () {
  "use strict";

  var form = document.getElementById("pseoInquiry");
  if (!form) return;

  var status = document.getElementById("pseoInquiryStatus");
  var submit = form.querySelector('button[type="submit"]');
  var endpoint = form.getAttribute("action");
  var label = submit ? submit.textContent : "보내기";

  function say(text, isErr) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-err", !!isErr);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = form.elements.email;
    if (!email.value || !email.checkValidity()) {
      say("이메일 주소를 확인해 주세요.", true);
      email.focus();
      return;
    }

    var data = new URLSearchParams();
    new FormData(form).forEach(function (value, key) {
      if (key === "_honey") return;
      data.append(key, value);
    });
    data.append("_captcha", "false");
    data.append("page", window.location.href);

    if (submit) { submit.disabled = true; submit.textContent = "보내는 중…"; }
    say("");

    var timer = null;
    var guard = new Promise(function (_, reject) {
      timer = window.setTimeout(function () { reject(new Error("timeout")); }, 12000);
    });

    Promise.race([
      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: data
      }).then(function (res) { return res.json().catch(function () { return {}; }); }),
      guard
    ]).then(function (result) {
      window.clearTimeout(timer);
      var ok = result && (result.success === "true" || result.success === true);
      if (!ok) throw new Error("not accepted");
      form.reset();
      say("문의를 접수했습니다. 영업일 1일 안에 회신드립니다.");
      if (submit) {
        submit.textContent = "접수 완료";
        window.setTimeout(function () {
          submit.disabled = false;
          submit.textContent = label;
        }, 4000);
      }
    }).catch(function () {
      window.clearTimeout(timer);
      say("지금은 문의를 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.", true);
      if (submit) { submit.disabled = false; submit.textContent = label; }
    });
  });
})();
