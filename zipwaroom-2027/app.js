(function () {
  'use strict';

  // 결제 링크 설정 변수 (런칭 시 래피드/리틀리 실제 URL만 교체)
  const CONFIG = {
    LATPEED_URL: 'https://www.latpeed.com/products/0Quu3',
    STORAGE_KEY: 'zipwaroom_2027_unlocked',
    LEGAL_NOTICE: '본 도구는 2026년 11월 기준 공개 세법 및 개편 논의를 바탕으로 한 개인 의사결정·시뮬레이션 참고용 도구이며 세무 대리·법률 자문이 아닙니다. 실제 매매·증여·신고 전 반드시 세무 전문가와 최종 확인하시기 바랍니다.'
  };

  const EOK = 100000000;
  const MAN = 10000;

  const PRESETS = [
    {
      name: '마용성·분당 1주택 50대 은퇴 예정자 (시세 18억, 비거주 갭투자)',
      houseCount: 1, currentPrice: 18, buyPrice: 9, publicPrice: 12.4,
      holdingYears: 7, residenceYears: 0, isRegulated: 'true',
      isJointOwned: 'false', age: 54, publicPensionIncome: 1200, earnedIncome: 0,
      rentalIncome: 0, financialIncome: 300, loanBalance: 2, giftTarget: 'spouse'
    },
    {
      name: '수도권 2주택자 (시세 14억+8억, 지금 팔까 버틸까)',
      houseCount: 2, currentPrice: 22, buyPrice: 12, publicPrice: 15.2,
      holdingYears: 8, residenceYears: 2, isRegulated: 'true',
      isJointOwned: 'false', age: 52, publicPensionIncome: 0, earnedIncome: 6000,
      rentalIncome: 0, financialIncome: 200, loanBalance: 4, giftTarget: 'spouse'
    },
    {
      name: '부부 단독명의 1주택 고가주택 (시세 24억, 공동명의 증여 고민)',
      houseCount: 1, currentPrice: 24, buyPrice: 11, publicPrice: 16.6,
      holdingYears: 10, residenceYears: 5, isRegulated: 'true',
      isJointOwned: 'false', age: 62, publicPensionIncome: 1800, earnedIncome: 0,
      rentalIncome: 0, financialIncome: 400, loanBalance: 1, giftTarget: 'spouse'
    },
    {
      name: '60대 은퇴자 (시세 13억+연금/임대소득, 건보료 피부양자 방어)',
      houseCount: 1, currentPrice: 13, buyPrice: 6, publicPrice: 9.0,
      holdingYears: 12, residenceYears: 8, isRegulated: 'true',
      isJointOwned: 'false', age: 65, publicPensionIncome: 1900, earnedIncome: 0,
      rentalIncome: 600, financialIncome: 200, loanBalance: 0, giftTarget: 'spouse'
    }
  ];

  let currentPolicyMode = 'current';
  let lastResult = null;

  function track(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  function fmtMan(won) {
    const man = Math.round(won / MAN);
    if (Math.abs(man) >= 10000) {
      const eok = Math.floor(Math.abs(man) / 10000);
      const rem = Math.abs(man) % 10000;
      const sign = man < 0 ? '-' : '';
      return rem > 0 ? `${sign}${eok}억 ${rem.toLocaleString()}만 원` : `${sign}${eok}억 원`;
    }
    return `${man.toLocaleString()}만 원`;
  }

  function fmtWon(won) {
    return `${Math.round(won).toLocaleString()}원`;
  }

  function $(id) { return document.getElementById(id); }

  function applyPreset(idx) {
    const p = PRESETS[idx];
    if (!p) return;
    $('houseCount').value = String(p.houseCount);
    $('currentPrice').value = String(p.currentPrice);
    $('buyPrice').value = String(p.buyPrice);
    $('publicPrice').value = String(p.publicPrice);
    $('holdingYears').value = String(p.holdingYears);
    $('residenceYears').value = String(p.residenceYears);
    $('isRegulated').value = p.isRegulated;
    $('isJointOwned').value = p.isJointOwned;
    $('age').value = String(p.age);
    $('publicPensionIncome').value = String(p.publicPensionIncome);
    $('earnedIncome').value = String(p.earnedIncome);
    $('rentalIncome').value = String(p.rentalIncome);
    $('financialIncome').value = String(p.financialIncome);
    $('loanBalance').value = String(p.loanBalance);
    $('giftTarget').value = p.giftTarget;

    document.querySelectorAll('.preset-btn').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
    });
    track('preset_click', { preset_index: idx + 1, preset_name: p.name });
    runSimulation();
  }

  function readInput() {
    return {
      houseCount: parseInt($('houseCount').value, 10) || 1,
      currentPrice: (parseFloat($('currentPrice').value) || 0) * EOK,
      buyPrice: (parseFloat($('buyPrice').value) || 0) * EOK,
      publicPrice: (parseFloat($('publicPrice').value) || 0) * EOK,
      holdingYears: parseFloat($('holdingYears').value) || 0,
      residenceYears: parseFloat($('residenceYears').value) || 0,
      isRegulated: $('isRegulated').value === 'true',
      isJointOwned: $('isJointOwned').value === 'true',
      age: parseInt($('age').value, 10) || 55,
      publicPensionIncome: (parseFloat($('publicPensionIncome').value) || 0) * MAN,
      earnedIncome: (parseFloat($('earnedIncome').value) || 0) * MAN,
      rentalIncome: (parseFloat($('rentalIncome').value) || 0) * MAN,
      financialIncome: (parseFloat($('financialIncome').value) || 0) * MAN,
      loanBalance: (parseFloat($('loanBalance').value) || 0) * EOK,
      giftTarget: $('giftTarget').value,
      policyMode: currentPolicyMode,
      compFairRatio: (parseFloat($('compFairRatio').value) || 60) / 100,
      priceGrowthRate: (parseFloat($('priceGrowthRate').value) || 0) / 100,
      loanRate: (parseFloat($('loanRate').value) || 4.2) / 100,
      surchargeEnabled: $('surchargeEnabled').value === 'true'
    };
  }

  function buildSvgBarChart(scenarios, bestId, worstId) {
    const maxVal = Math.max(...scenarios.map(s => Math.max(0, s.netWorth)), 1);
    const width = 680;
    const height = 262;
    const padL = 20, padR = 20, padT = 32, padB = 44;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const barW = 92;
    const gap = (chartW - barW * scenarios.length) / (scenarios.length + 1);

    let bars = '';
    scenarios.forEach((s, idx) => {
      const x = padL + gap * (idx + 1) + barW * idx;
      const h = Math.max(8, Math.round((Math.max(0, s.netWorth) / maxVal) * chartH));
      const y = padT + chartH - h;
      let fill = '#D1D6DB';
      if (s.id === bestId) fill = '#3182F6';
      else if (s.id === worstId) fill = '#F04452';

      bars += `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" fill="${fill}" />
        <text x="${x + barW / 2}" y="${y - 10}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#191F28">${fmtMan(s.netWorth)}</text>
        <text x="${x + barW / 2}" y="${height - 30}" text-anchor="middle" font-size="12" font-weight="600" fill="#4E5968">${s.id}. ${s.shortName}</text>
        <text x="${x + barW / 2}" y="${height - 10}" text-anchor="middle" font-size="10.5" fill="#8B95A1">세금 ${fmtMan(s.totalTax)}</text>
      `;
    });

    return `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:680px;display:block;margin:0 auto;background:#F7F8FA;border-radius:16px;">${bars}</svg>`;
  }

  function renderResult(res) {
    lastResult = res;
    $('shockGapText').textContent = `최대 ${fmtMan(res.maxGap)}`;
    $('bestTag').textContent = `가장 유리한 선택: ${res.best.name} (순자산 ${fmtMan(res.best.netWorth)})`;
    $('worstTag').textContent = `가장 불리한 선택: ${res.worst.name} (순자산 ${fmtMan(res.worst.netWorth)})`;

    // 3대 진단 경보 배지
    const b = res.badges;
    $('badgesRow').innerHTML = `
      <span class="diag-badge ${b.dependentLossRisk ? 'danger' : 'ok'}">${b.dependentLossRisk ? '건보료 피부양자 탈락 위험 · 월 ' + fmtWon(res.currentHealthInsurance.monthlyTotal) : '건보료 피부양자 유지 구간'}</span>
      <span class="diag-badge ${b.taxSpikeRisk ? 'danger' : 'ok'}">${b.taxSpikeRisk ? '2027~2029 세부담 급증 구간' : '보유세 급증 경보 없음'}</span>
      <span class="diag-badge ${b.giftCarryoverRisk ? 'warn' : 'ok'}">${b.giftCarryoverRisk ? '증여 10년 이월과세 주의 · 5년 내 매도 시 원취득가 과세' : '증여 10년 이월과세 해당 없음'}</span>
    `;

    $('svgChartWrap').innerHTML = buildSvgBarChart(res.scenarios, res.best.id, res.worst.id);

    $('scenarioCards').innerHTML = res.scenarios.map(s => {
      const cls = s.id === res.best.id ? 'sc-card best' : s.id === res.worst.id ? 'sc-card worst' : 'sc-card';
      return `
        <div class="${cls}">
          <div class="sc-title">${s.name}</div>
          <div class="sc-net">${fmtMan(s.netWorth)}</div>
          <div class="sc-meta">
            5년 총 세금: <strong>${fmtMan(s.totalTax)}</strong><br/>
            5년 누적 건보료: <strong>${fmtMan(s.totalHealthIns)}</strong><br/>
            5년 대출이자: ${fmtMan(s.totalInterest)}
          </div>
        </div>
      `;
    }).join('');

    // 상세 리포트 영역 렌더링 (잠금 시 블러)
    renderDetailedSections(res);
    renderPrintReport(res);
  }

  function renderDetailedSections(res) {
    const scB = res.scenarios[1];
    const scC = res.scenarios[2];

    let rows = '';
    for (let i = 0; i < 5; i++) {
      const yb = scB.years[i];
      const yc = scC.years[i];
      rows += `
        <tr>
          <td>${yb.year}년</td>
          <td>${fmtMan(yb.price)}</td>
          <td>${fmtWon(yb.propertyTax)}</td>
          <td>${fmtWon(yb.compTax)}</td>
          <td>${fmtWon(yb.healthIns)}</td>
          <td>${fmtWon(yc.compTax)}</td>
          <td>${fmtWon(yb.interest)}</td>
        </tr>
      `;
    }
    $('yearlyTableWrap').innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>연도</th><th>예상 시세</th><th>재산세(B)</th><th>종부세(B 현상태)</th><th>연 건보료(B)</th><th>종부세(C 실거주)</th><th>연 대출이자</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    const nhi = res.currentHealthInsurance;
    $('healthDetailWrap').innerHTML = `
      <p style="font-size:14px;">
        현재 기준 피부양자 판정: <strong>${nhi.isDependentDisqualified ? '탈락 (지역가입자 전환 대상)' : '유지 가능'}</strong><br/>
        사유: ${nhi.reasons.length ? nhi.reasons.join(', ') : '소득·재산 기준 모두 충족'}<br/>
        지역가입자 전환 시 예상 월 건보료: <strong>${fmtWon(nhi.monthlyTotal)}</strong> (건보 ${fmtWon(nhi.healthPremium)} + 장기요양 ${fmtWon(nhi.longTermCarePremium)} / 재산등급 점수 ${nhi.score}점)
      </p>
    `;

    const scD = res.scenarios[3];
    const gd = scD.giftDetail;
    $('giftDetailWrap').innerHTML = `
      <p style="font-size:14px;">
        증여 지분가액(${fmtMan(gd.giftValue)}) 기준 공제액 <strong>${fmtMan(gd.deduction)}</strong> 적용 시:<br/>
        • 초기 증여세: <strong>${fmtWon(gd.giftTax)}</strong> / 증여 취득세(${(gd.acqRate * 100).toFixed(1)}%): <strong>${fmtWon(gd.acquisitionTax)}</strong> / 합계 <strong>${fmtWon(gd.totalUpfrontCost)}</strong><br/>
        • 5년 보유 후 매도 시 10년 이내 이월과세 적용 여부: <strong>${gd.carryoverRisk ? '적용 대상 (원 취득가액 기준으로 양도세 산출)' : '해당 없음'}</strong>
      </p>
    `;

    $('taxQuestionsList').innerHTML = res.taxQuestions.map(q => `<li style="margin-bottom:6px;">${q}</li>`).join('');
  }

  function renderPrintReport(res) {
    const footer = `<div class="pdf-footer">${CONFIG.LEGAL_NOTICE}</div>`;
    const inp = res.input;
    const scA = res.scenarios[0], scB = res.scenarios[1], scC = res.scenarios[2], scD = res.scenarios[3];

    const makeYearTable = (sc) => `
      <table class="data-table">
        <thead><tr><th>연도</th><th>예상 자산가치</th><th>재산세</th><th>종부세</th><th>연 건보료(월)</th><th>대출이자</th></tr></thead>
        <tbody>
          ${sc.years.map(y => `<tr><td>${y.year}년</td><td>${fmtMan(y.price)}</td><td>${fmtWon(y.propertyTax)}</td><td>${fmtWon(y.compTax)}</td><td>${fmtWon(y.healthIns)} (${fmtWon(y.monthlyHealthIns)}/월)</td><td>${fmtWon(y.interest)}</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    $('printReportRoot').innerHTML = `
      <!-- Page 1: 표지 & 자산·정책 요약 -->
      <div class="pdf-page">
        <div class="pdf-cover">
          <p style="font-weight:800;color:#059669;margin:0;">ZIPWAROOM 2027 · 10페이지 통합 전략 리포트</p>
          <h1 style="margin:10px 0 8px;">2027~2029 집·세금·건보료 의사결정 전략서</h1>
          <p style="color:#4E5968;margin:0;">생성 일시: ${new Date().toLocaleString('ko-KR')} · 정책 모드: ${inp.policyMode === 'reform' ? '2027~2029 개편 시나리오' : '2026년 11월 현행법 기준'}</p>
        </div>
        <h3>1. 입력 자산 및 정책 가정 요약</h3>
        <table class="data-table">
          <tbody>
            <tr><td>보유 주택 수 / 규제지역</td><td>${inp.houseCount}주택 / ${inp.isRegulated ? '조정대상지역' : '비규제지역'}</td></tr>
            <tr><td>현재 시세 / 취득가 / 공시가격</td><td>${fmtMan(inp.currentPrice)} / ${fmtMan(inp.buyPrice)} / ${fmtMan(res.basePublicPrice)}</td></tr>
            <tr><td>현재 보유 / 실거주 / 만 나이</td><td>${inp.holdingYears}년 / ${inp.residenceYears}년 / 만 ${inp.age}세</td></tr>
            <tr><td>연 소득 (연금/근로/임대/금융)</td><td>${fmtMan(inp.publicPensionIncome)} / ${fmtMan(inp.earnedIncome)} / ${fmtMan(inp.rentalIncome)} / ${fmtMan(inp.financialIncome)}</td></tr>
            <tr><td>대출 잔액 / 금리 / 예상 집값 상승률</td><td>${fmtMan(inp.loanBalance)} / ${(inp.loanRate*100).toFixed(1)}% / 연 ${(inp.priceGrowthRate*100).toFixed(1)}%</td></tr>
          </tbody>
        </table>
        ${footer}
      </div>

      <!-- Page 2: 4대 시나리오 총괄 비교 대시보드 -->
      <div class="pdf-page">
        <h2>2. 4대 핵심 전략 5년(2026~2031) 순자산 & 세금·건보료 비교</h2>
        <p><strong>최대 순자산 격차:</strong> ${fmtMan(res.maxGap)} (최선: ${res.best.name} vs 최악: ${res.worst.name})</p>
        ${buildSvgBarChart(res.scenarios, res.best.id, res.worst.id)}
        <table class="data-table">
          <thead><tr><th>시나리오</th><th>초기비용/양도세</th><th>5년 보유세</th><th>5년 건보료</th><th>5년 총세금</th><th>최종 순자산</th></tr></thead>
          <tbody>
            ${res.scenarios.map(s => `<tr><td>${s.name}</td><td>${fmtMan(s.capGainTax)}</td><td>${fmtMan(s.totalPropTax + s.totalCompTax)}</td><td>${fmtMan(s.totalHealthIns)}</td><td>${fmtMan(s.totalTax)}</td><td><strong>${fmtMan(s.netWorth)}</strong></td></tr>`).join('')}
          </tbody>
        </table>
        ${footer}
      </div>

      <!-- Page 3: 시나리오 A & B 상세 -->
      <div class="pdf-page">
        <h2>3-1. 시나리오 A (지금 매도) &amp; B (현 상태 5년 보유) 현금흐름</h2>
        <h4>${scA.name} (매도 시 양도세 ${fmtWon(scA.capGainTax)}, 세후 현금 연 2.5% 운용 가정)</h4>
        ${makeYearTable(scA)}
        <h4>${scB.name} (최종 매도 시 양도세 ${fmtWon(scB.capGainTax)})</h4>
        ${makeYearTable(scB)}
        ${footer}
      </div>

      <!-- Page 4: 시나리오 C & D 상세 -->
      <div class="pdf-page">
        <h2>3-2. 시나리오 C (실거주 전환) &amp; D (명의변경/증여) 현금흐름</h2>
        <h4>${scC.name} (최종 매도 시 양도세 ${fmtWon(scC.capGainTax)})</h4>
        ${makeYearTable(scC)}
        <h4>${scD.name} (초기 증여·취득세 ${fmtWon(scD.upfrontCost)}, 최종 양도세 ${fmtWon(scD.capGainTax)})</h4>
        ${makeYearTable(scD)}
        ${footer}
      </div>

      <!-- Page 5: 건강보험 피부양자 & 월 건보료 방어 전략 -->
      <div class="pdf-page">
        <h2>4. 건강보험 피부양자 탈락 시뮬레이션 &amp; 방어 체크리스트</h2>
        <p><strong>현재 재산세 과세표준:</strong> ${fmtWon(res.currentPropertyTax.taxBase)} · <strong>피부양자 판정:</strong> ${res.currentHealthInsurance.isDependentDisqualified ? '탈락 위험' : '유지'}</p>
        <p><strong>지역가입자 전환 시 예상 월 건보료:</strong> ${fmtWon(res.currentHealthInsurance.monthlyTotal)} (5년 누적 최대 ${fmtWon(scB.totalHealthIns)})</p>
        <ul>
          <li>재산세 과세표준 5.4억 원 초과 시 합산소득 한도가 2,000만 원에서 1,000만 원으로 절반 축소됩니다.</li>
          <li>재산세 과세표준 9억 원 초과 시 소득이 0원이어도 피부양자 자격이 즉시 박탈됩니다.</li>
          <li>주택임대소득은 금액과 무관하게 발생 즉시 피부양자 탈락 사유가 될 수 있습니다.</li>
          <li>1세대 1주택자는 주택담보대출 공제(최대 5,000만 원)를 공단에 별도 신고해야 재산 건보료를 줄일 수 있습니다.</li>
        </ul>
        ${footer}
      </div>

      <!-- Page 6: 공동명의 / 증여 손익분기점 & 10년 이월과세 -->
      <div class="pdf-page">
        <h2>5. 부부 공동명의 / 사전증여 손익분기점 &amp; 10년 이월과세 경고</h2>
        <p>증여 지분가액 ${fmtMan(scD.giftDetail.giftValue)} 기준 초기 증여세 ${fmtWon(scD.giftDetail.giftTax)} + 취득세 ${fmtWon(scD.giftDetail.acquisitionTax)} = 총 ${fmtWon(scD.giftDetail.totalUpfrontCost)}가 즉시 지출됩니다.</p>
        <p><strong>10년 이월과세 함정:</strong> 배우자·직계존비속에게 증여 후 10년 이내에 제3자에게 매도하면 증여가액이 아닌 원 증여자의 취득가액(${fmtMan(inp.buyPrice)})으로 양도세가 부과됩니다. 5년 내 매도 계획이 있다면 증여 전 반드시 매도 vs 장기보유를 확정해야 합니다.</p>
        ${footer}
      </div>

      <!-- Page 7 & 8: 세무사 대면 상담 질문 10선 -->
      <div class="pdf-page">
        <h2>6. 세무사 대면 상담 시 그대로 들고 갈 핵심 질문 10선 (1/2)</h2>
        <ol>${res.taxQuestions.slice(0, 5).map(q => `<li style="margin-bottom:14px;">${q}</li>`).join('')}</ol>
        ${footer}
      </div>
      <div class="pdf-page">
        <h2>6. 세무사 대면 상담 시 그대로 들고 갈 핵심 질문 10선 (2/2)</h2>
        <ol start="6">${res.taxQuestions.slice(5, 10).map(q => `<li style="margin-bottom:14px;">${q}</li>`).join('')}</ol>
        ${footer}
      </div>

      <!-- Page 9 & 10: 산출 기준 및 법적 면책 부록 -->
      <div class="pdf-page">
        <h2>7. 산출 기준 · 정책 가정 및 법적 면책 부록</h2>
        <p>본 리포트는 2026년 11월 기준 소득세법·지방세법·종합부동산세법·상속세및증여세법·국민건강보험법과 정부의 2027~2029년 세제개편안(국회 심의 중, 미확정)을 반영한 시뮬레이션입니다.</p>
        <ul>
          <li>필요경비는 취득가의 3%로 기본 추정하며, 실제 자본적 지출·중개보수 증빙에 따라 달라질 수 있습니다.</li>
          <li>시나리오 A(지금 매도)는 매도 세후 현금을 연 2.5%(세후)로 5년간 운용한 기준입니다.</li>
          <li>개별 특례(일시적 2주택·상속주택·임대사업자 등록 감면 등)는 세무사 대면 검토가 필요합니다.</li>
        </ul>
        ${footer}
      </div>
    `;
  }

  function runSimulation() {
    const input = readInput();
    const res = window.ZipWaroomEngine.simulateFiveYears(input);
    renderResult(res);
    track('simulation_run', { policy_mode: input.policyMode, house_count: input.houseCount });
  }

  async function sha256Hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function setUnlockedUI(unlocked) {
    const body = $('detailedReportBody');
    const overlay = $('paywallOverlay');
    const bar = $('unlockedBar');
    if (unlocked) {
      body.classList.remove('blur-locked');
      overlay.style.display = 'none';
      bar.classList.add('show');
    } else {
      body.classList.add('blur-locked');
      overlay.style.display = 'block';
      bar.classList.remove('show');
    }
  }

  async function verifyLicenseKey(rawKey) {
    const key = String(rawKey || '').trim().toUpperCase();
    if (!key) {
      $('keyErrorMsg').textContent = '인증키를 입력해 주세요.';
      return;
    }
    const auth = window.ZIPWAROOM_AUTH || { SALT: '', HASHES: [] };
    const digest = await sha256Hex(`${auth.SALT}:${key}`);
    const valid = auth.HASHES.includes(digest);
    if (valid) {
      localStorage.setItem(CONFIG.STORAGE_KEY, '1');
      setUnlockedUI(true);
      $('unlockModal').classList.remove('open');
      $('keyErrorMsg').textContent = '';
      track('license_unlock_success');
    } else {
      $('keyErrorMsg').textContent = '유효하지 않은 인증키입니다. 대소문자 및 하이픈(-)을 확인해 주세요.';
    }
  }

  function init() {
    $('latpeedPayLink').href = CONFIG.LATPEED_URL;

    // 아코디언 토글
    document.querySelectorAll('.accordion-header').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.parentElement.classList.toggle('open');
      });
    });

    // 프리셋 버튼
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(parseInt(btn.dataset.preset, 10));
      });
    });

    // 시세 변경 시 공시가 69% 자동 추정
    $('currentPrice').addEventListener('input', () => {
      const cp = parseFloat($('currentPrice').value) || 0;
      $('publicPrice').value = (cp * 0.69).toFixed(1);
    });

    // 정책 모드 토글
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPolicyMode = btn.dataset.policy;
        if (currentPolicyMode === 'reform') {
          $('compFairRatio').value = '70';
          $('compFairRatioVal').textContent = '70';
        } else {
          $('compFairRatio').value = '60';
          $('compFairRatioVal').textContent = '60';
        }
        runSimulation();
      });
    });

    // 슬라이더 라벨 동기화
    $('compFairRatio').addEventListener('input', e => { $('compFairRatioVal').textContent = e.target.value; });
    $('priceGrowthRate').addEventListener('input', e => { $('priceGrowthVal').textContent = parseFloat(e.target.value).toFixed(1); });
    $('loanRate').addEventListener('input', e => { $('loanRateVal').textContent = parseFloat(e.target.value).toFixed(1); });

    $('runSimBtn').addEventListener('click', runSimulation);

    // 모달 제어
    $('openPaywallBtn').addEventListener('click', () => {
      $('unlockModal').classList.add('open');
      track('paywall_cta_click', {});
    });
    $('closeModalBtn').addEventListener('click', () => {
      $('unlockModal').classList.remove('open');
    });
    $('verifyKeyBtn').addEventListener('click', () => {
      verifyLicenseKey($('licenseKeyInput').value);
    });
    $('printPdfBtn').addEventListener('click', () => {
      track('pdf_print_click', {});
      window.print();
    });

    // 저장된 해제 상태 복원
    if (localStorage.getItem(CONFIG.STORAGE_KEY) === '1') {
      setUnlockedUI(true);
    }

    // 초기 프리셋 1번 즉시 실행
    applyPreset(0);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
