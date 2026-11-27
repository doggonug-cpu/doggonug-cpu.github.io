/**
 * ZIPWAROOM 2027 — 2027~2029 부동산·건보료·증여 통합 시뮬레이션 코어 엔진
 * 기준일: 2026년 11월 (대한민국 현행 확정법 + 2027~2029 개편 시나리오)
 * 100% 브라우저 로컬 순수 함수 모듈 (외부 통신 0%)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ZipWaroomEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EOK = 100000000;
  const MAN = 10000;

  // 국민건강보험법 시행령 별표 4 재산등급표 (공제 후 재산과표 만원 단위 상한 -> 점수)
  // 1등급(450만원 이하: 22점) ~ 60등급(778,124만원 초과: 2,341점) 대표 구간 보간 및 공식 구간표
  const NHI_PROPERTY_BRACKETS = [
    [0, 0],
    [450 * MAN, 22],
    [900 * MAN, 44],
    [1350 * MAN, 67],
    [1800 * MAN, 90],
    [2250 * MAN, 114],
    [2700 * MAN, 139],
    [3150 * MAN, 165],
    [3600 * MAN, 191],
    [4050 * MAN, 217],
    [4500 * MAN, 244],
    [5020 * MAN, 270],
    [5590 * MAN, 296],
    [6220 * MAN, 322],
    [6930 * MAN, 348],
    [7710 * MAN, 375],
    [8590 * MAN, 401],
    [9570 * MAN, 427],
    [10700 * MAN, 439],
    [11900 * MAN, 463],
    [13200 * MAN, 487],
    [14800 * MAN, 511],
    [16400 * MAN, 535],
    [18300 * MAN, 559],
    [20400 * MAN, 583],
    [22700 * MAN, 608],
    [25300 * MAN, 632],
    [28200 * MAN, 657],
    [31400 * MAN, 681],
    [34900 * MAN, 706],
    [38800 * MAN, 731],
    [43200 * MAN, 761],
    [48100 * MAN, 792],
    [53600 * MAN, 823],
    [59700 * MAN, 855],
    [66500 * MAN, 887],
    [74100 * MAN, 920],
    [82500 * MAN, 954],
    [91900 * MAN, 989],
    [102400 * MAN, 1025],
    [114000 * MAN, 1062],
    [127000 * MAN, 1100],
    [141400 * MAN, 1139],
    [157500 * MAN, 1180],
    [175400 * MAN, 1222],
    [195300 * MAN, 1266],
    [217500 * MAN, 1312],
    [242200 * MAN, 1360],
    [269700 * MAN, 1411],
    [300400 * MAN, 1465],
    [334500 * MAN, 1522],
    [372500 * MAN, 1583],
    [414800 * MAN, 1648],
    [461900 * MAN, 1718],
    [514400 * MAN, 1793],
    [572900 * MAN, 1875],
    [638000 * MAN, 1965],
    [710500 * MAN, 2065],
    [778124 * MAN, 2190],
    [Infinity, 2341]
  ];

  function getPropertyScore(netPropertyTaxBase) {
    if (netPropertyTaxBase <= 0) return 0;
    for (let i = 1; i < NHI_PROPERTY_BRACKETS.length; i++) {
      if (netPropertyTaxBase <= NHI_PROPERTY_BRACKETS[i][0]) {
        return NHI_PROPERTY_BRACKETS[i][1];
      }
    }
    return 2341;
  }

  /**
   * 1. 양도소득세 계산
   */
  function calcCapitalGainsTax(p) {
    const sellPrice = Math.max(0, p.sellPrice || 0);
    const buyPrice = Math.max(0, p.buyPrice || 0);
    const expenses = Math.max(0, p.expenses !== undefined ? p.expenses : Math.round(buyPrice * 0.03));
    const holdingYears = Math.max(0, p.holdingYears || 0);
    const residenceYears = Math.max(0, p.residenceYears || 0);
    const houseCount = Math.max(1, p.houseCount || 1);
    const isRegulated = Boolean(p.isRegulated);
    const surchargeEnabled = p.surchargeEnabled !== undefined ? Boolean(p.surchargeEnabled) : true;
    const surchargeAddOverride = p.surchargeAddOverride; // 2027/2028 한시 완화 시나리오용
    const policyMode = p.policyMode || 'current'; // 'current' | 'reform'
    const year = p.year || 2026;
    const isOneHouseExemptEligible =
      houseCount === 1 &&
      holdingYears >= 2 &&
      (!isRegulated || residenceYears >= 2);

    const rawGain = Math.max(0, sellPrice - buyPrice - expenses);
    if (rawGain <= 0) {
      return {
        rawGain: 0,
        taxableGain: 0,
        longTermDeduction: 0,
        longTermRate: 0,
        basicDeduction: 0,
        taxBase: 0,
        nationalTax: 0,
        localTax: 0,
        totalTax: 0,
        isExempt: isOneHouseExemptEligible && sellPrice <= 12 * EOK,
        surchargeApplied: false,
        surchargeRate: 0
      };
    }

    // 1세대 1주택 12억 이하 전액 비과세
    if (isOneHouseExemptEligible && sellPrice <= 12 * EOK) {
      return {
        rawGain,
        taxableGain: 0,
        longTermDeduction: 0,
        longTermRate: 0,
        basicDeduction: 0,
        taxBase: 0,
        nationalTax: 0,
        localTax: 0,
        totalTax: 0,
        isExempt: true,
        surchargeApplied: false,
        surchargeRate: 0
      };
    }

    // 고가 1주택 12억 초과 안분
    let taxableGain = rawGain;
    if (isOneHouseExemptEligible && sellPrice > 12 * EOK) {
      taxableGain = Math.round(rawGain * ((sellPrice - 12 * EOK) / sellPrice));
    }

    // 단기 양도 (2년 미만)
    if (holdingYears < 2) {
      const rate = holdingYears < 1 ? 0.70 : 0.60;
      const basicDed = Math.min(taxableGain, 250 * MAN);
      const taxBase = Math.max(0, taxableGain - basicDed);
      const nationalTax = Math.floor(taxBase * rate);
      const localTax = Math.floor(nationalTax * 0.1);
      return {
        rawGain,
        taxableGain,
        longTermDeduction: 0,
        longTermRate: 0,
        basicDeduction: basicDed,
        taxBase,
        nationalTax,
        localTax,
        totalTax: nationalTax + localTax,
        isExempt: false,
        surchargeApplied: false,
        surchargeRate: 0
      };
    }

    // 다주택 중과 판정
    let surchargeAdd = 0;
    if (houseCount >= 2 && isRegulated && surchargeEnabled) {
      if (typeof surchargeAddOverride === 'number') {
        surchargeAdd = surchargeAddOverride;
      } else if (policyMode === 'reform') {
        if (year === 2027) surchargeAdd = houseCount === 2 ? 0.05 : 0.10;
        else if (year === 2028) surchargeAdd = houseCount === 2 ? 0.10 : 0.15;
        else surchargeAdd = houseCount === 2 ? 0.20 : 0.30;
      } else {
        surchargeAdd = houseCount === 2 ? 0.20 : 0.30;
      }
    }
    const surchargeApplied = surchargeAdd > 0;

    // 장기보유특별공제
    let longTermRate = 0;
    if (!surchargeApplied && holdingYears >= 3) {
      if (policyMode === 'reform' && year >= 2028) {
        // 개편안: 거주 중심 공제 (비거주 공제 배제)
        if (houseCount === 1 && residenceYears >= 2) {
          // 거주 연 8% (최대 80%, 10년) 또는 보유+거주 중 거주 집중
          longTermRate = Math.min(0.80, Math.floor(residenceYears) * 0.08);
        } else {
          longTermRate = 0;
        }
      } else {
        // 현행법
        if (houseCount === 1 && residenceYears >= 2) {
          const holdPct = Math.min(10, Math.floor(holdingYears)) * 0.04;
          const resPct = Math.min(10, Math.floor(residenceYears)) * 0.04;
          longTermRate = Math.min(0.80, Math.round((holdPct + resPct) * 10000) / 10000);
        } else {
          longTermRate = Math.min(0.30, Math.floor(holdingYears) * 0.02);
        }
      }
    }

    let longTermDeduction = Math.round(taxableGain * longTermRate);
    // 개편안 장특공제 한도 ('28년 20억, '29년+ 10억)
    if (policyMode === 'reform') {
      if (year === 2028) longTermDeduction = Math.min(longTermDeduction, 20 * EOK);
      else if (year >= 2029) longTermDeduction = Math.min(longTermDeduction, 10 * EOK);
    }

    const incomeAmount = Math.max(0, taxableGain - longTermDeduction);
    let basicDeductionAmount = 250 * MAN;
    if (policyMode === 'reform' && year >= 2028 && houseCount === 1 && residenceYears >= 10 && sellPrice <= 30 * EOK) {
      basicDeductionAmount = 2500 * MAN;
    }
    const basicDeduction = Math.min(incomeAmount, basicDeductionAmount);
    const taxBase = Math.max(0, incomeAmount - basicDeduction);

    // 8단계 누진세율표
    const brackets = [
      [1400 * MAN, 0.06, 0],
      [5000 * MAN, 0.15, 126 * MAN],
      [8800 * MAN, 0.24, 576 * MAN],
      [15000 * MAN, 0.35, 1544 * MAN],
      [30000 * MAN, 0.38, 1994 * MAN],
      [50000 * MAN, 0.40, 2594 * MAN],
      [100000 * MAN, 0.42, 3594 * MAN],
      [Infinity, 0.45, 6594 * MAN]
    ];

    let nationalTax = 0;
    if (taxBase > 0) {
      for (let i = 0; i < brackets.length; i++) {
        if (taxBase <= brackets[i][0]) {
          const baseRate = brackets[i][1];
          const progDed = brackets[i][2];
          nationalTax = Math.max(0, Math.floor(taxBase * (baseRate + surchargeAdd) - progDed));
          break;
        }
      }
    }
    const localTax = Math.floor(nationalTax * 0.1);

    return {
      rawGain,
      taxableGain,
      longTermDeduction,
      longTermRate,
      basicDeduction,
      taxBase,
      nationalTax,
      localTax,
      totalTax: nationalTax + localTax,
      isExempt: false,
      surchargeApplied,
      surchargeRate: surchargeAdd
    };
  }

  /**
   * 2. 재산세 계산 (단일 주택 또는 합산 기준)
   */
  function calcPropertyTax(p) {
    const publicPrice = Math.max(0, p.publicPrice || 0);
    const isOneHouse = Boolean(p.isOneHouse);
    const includeUrban = p.includeUrban !== undefined ? Boolean(p.includeUrban) : true;
    const prevTax = p.prevTax;

    // 2026년 1세대 1주택 공정시장가액비율: 3억 이하 43%, 3~6억 44%, 6억 초과 45%, 그 외 60%
    let fairRatio = 0.60;
    if (isOneHouse) {
      if (publicPrice <= 3 * EOK) fairRatio = 0.43;
      else if (publicPrice <= 6 * EOK) fairRatio = 0.44;
      else fairRatio = 0.45;
    }

    const taxBase = Math.floor(publicPrice * fairRatio);
    const useSpecialRate = isOneHouse && publicPrice <= 9 * EOK;

    let mainTax = 0;
    if (useSpecialRate) {
      if (taxBase <= 6000 * MAN) mainTax = taxBase * 0.0005;
      else if (taxBase <= 15000 * MAN) mainTax = 3 * MAN + (taxBase - 6000 * MAN) * 0.001;
      else if (taxBase <= 30000 * MAN) mainTax = 12 * MAN + (taxBase - 15000 * MAN) * 0.002;
      else mainTax = 42 * MAN + (taxBase - 30000 * MAN) * 0.0035;
    } else {
      if (taxBase <= 6000 * MAN) mainTax = taxBase * 0.001;
      else if (taxBase <= 15000 * MAN) mainTax = 6 * MAN + (taxBase - 6000 * MAN) * 0.0015;
      else if (taxBase <= 30000 * MAN) mainTax = 19.5 * MAN + (taxBase - 15000 * MAN) * 0.0025;
      else mainTax = 57 * MAN + (taxBase - 30000 * MAN) * 0.004;
    }
    mainTax = Math.floor(mainTax);

    // 세부담 상한 (본세 기준)
    if (typeof prevTax === 'number' && prevTax > 0) {
      const capRate = publicPrice <= 3 * EOK ? 1.05 : publicPrice <= 6 * EOK ? 1.10 : 1.30;
      mainTax = Math.min(mainTax, Math.floor(prevTax * capRate));
    }

    const urbanTax = includeUrban ? Math.floor(taxBase * 0.0014) : 0;
    const eduTax = Math.floor(mainTax * 0.20);
    const totalTax = mainTax + urbanTax + eduTax;

    return {
      publicPrice,
      fairRatio,
      taxBase,
      mainTax,
      urbanTax,
      eduTax,
      totalTax
    };
  }

  /**
   * 3. 종합부동산세 계산 (단독명의 / 부부 공동명의 자동 비교 포함)
   */
  function calcComprehensiveRealEstateTax(p) {
    const publicPrice = Math.max(0, p.publicPrice || 0);
    const houseCount = Math.max(1, p.houseCount || 1);
    const isOneHouse = houseCount === 1;
    const isJoint = Boolean(p.isJoint) && isOneHouse;
    const jointRatio = p.jointRatio !== undefined ? p.jointRatio : 0.5;
    const age = p.age || 50;
    const holdingYears = p.holdingYears || 0;
    const residenceYears = p.residenceYears || 0;
    const policyMode = p.policyMode || 'current';
    const year = p.year || 2026;
    const fairRatio = p.compFairRatio !== undefined
      ? p.compFairRatio
      : (policyMode === 'reform' ? (houseCount >= 3 ? 0.80 : 0.70) : 0.60);

    function computeForPerson(personPublicPrice, deduction, allowCredit, propFairRatio) {
      const overAmount = Math.max(0, personPublicPrice - deduction);
      const taxBase = Math.floor(overAmount * fairRatio);
      if (taxBase <= 0) {
        return { taxBase: 0, grossTax: 0, propDed: 0, credit: 0, compTax: 0, agriTax: 0, totalTax: 0 };
      }

      // 세율표 (2주택 이하 vs 3주택 이상)
      const isHeavy = houseCount >= 3 && policyMode !== 'reform_flat';
      const rates = isHeavy
        ? [
            [3 * EOK, 0.005, 0],
            [6 * EOK, 0.007, 60 * MAN],
            [12 * EOK, 0.010, 240 * MAN],
            [25 * EOK, 0.020, 1440 * MAN],
            [50 * EOK, 0.030, 3940 * MAN],
            [94 * EOK, 0.040, 8940 * MAN],
            [Infinity, 0.050, 18340 * MAN]
          ]
        : [
            [3 * EOK, 0.005, 0],
            [6 * EOK, 0.007, 60 * MAN],
            [12 * EOK, 0.010, 240 * MAN],
            [25 * EOK, 0.013, 600 * MAN],
            [50 * EOK, 0.015, 1100 * MAN],
            [94 * EOK, 0.020, 3600 * MAN],
            [Infinity, 0.027, 10180 * MAN]
          ];

      let grossTax = 0;
      for (let i = 0; i < rates.length; i++) {
        if (taxBase <= rates[i][0]) {
          grossTax = Math.max(0, Math.floor(taxBase * rates[i][1] - rates[i][2]));
          break;
        }
      }

      // 재산세 중복분 공제
      const propDed = Math.floor(taxBase * propFairRatio * 0.004);
      const afterProp = Math.max(0, grossTax - propDed);

      // 1세대 1주택 세액공제 (연령 + 보유기간, 최대 80%)
      let credit = 0;
      if (allowCredit) {
        let ageRate = 0;
        if (age >= 70) ageRate = 0.40;
        else if (age >= 65) ageRate = 0.30;
        else if (age >= 60) ageRate = 0.20;

        let holdRate = 0;
        if (holdingYears >= 15) holdRate = 0.50;
        else if (holdingYears >= 10) holdRate = 0.40;
        else if (holdingYears >= 5) holdRate = 0.20;

        const totalCreditRate = Math.min(0.80, ageRate + holdRate);
        credit = Math.floor(afterProp * totalCreditRate);

        if (policyMode === 'reform') {
          if (year === 2027) credit = Math.min(credit, 800 * MAN);
          else if (year >= 2028) credit = Math.min(credit, 600 * MAN);
        }
      }

      const compTax = Math.max(0, afterProp - credit);
      const agriTax = Math.floor(compTax * 0.20);
      return {
        taxBase,
        grossTax,
        propDed,
        credit,
        compTax,
        agriTax,
        totalTax: compTax + agriTax
      };
    }

    // 1세대 1주택 기본공제 결정
    let oneHouseDeduction = 12 * EOK;
    if (policyMode === 'reform') {
      if (residenceYears >= 2) oneHouseDeduction = 14 * EOK; // 거주 1주택 14억
      else oneHouseDeduction = 9 * EOK; // 비거주 1주택 9억
    }

    const propFair = isOneHouse ? (publicPrice <= 3 * EOK ? 0.43 : publicPrice <= 6 * EOK ? 0.44 : 0.45) : 0.60;

    if (!isOneHouse) {
      // 다주택
      const multiDed = policyMode === 'reform' ? 9 * EOK : 9 * EOK;
      const res = computeForPerson(publicPrice, multiDed, false, 0.60);
      return Object.assign({ mode: 'multi', deduction: multiDed, fairRatio }, res);
    }

    if (!isJoint) {
      const res = computeForPerson(publicPrice, oneHouseDeduction, true, propFair);
      return Object.assign({ mode: 'single', deduction: oneHouseDeduction, fairRatio }, res);
    }

    // 부부 공동명의 1주택: 각자 9억(합산 18억, 세액공제 없음) vs 1주택 특례(12/14억 + 세액공제) 비교
    const p1 = computeForPerson(Math.round(publicPrice * jointRatio), 9 * EOK, false, propFair);
    const p2 = computeForPerson(Math.round(publicPrice * (1 - jointRatio)), 9 * EOK, false, propFair);
    const eachNineTotal = p1.totalTax + p2.totalTax;
    const specialRes = computeForPerson(publicPrice, oneHouseDeduction, true, propFair);

    const bestIsEachNine = eachNineTotal <= specialRes.totalTax;
    const chosen = bestIsEachNine
      ? {
          taxBase: p1.taxBase + p2.taxBase,
          grossTax: p1.grossTax + p2.grossTax,
          propDed: p1.propDed + p2.propDed,
          credit: 0,
          compTax: p1.compTax + p2.compTax,
          agriTax: p1.agriTax + p2.agriTax,
          totalTax: eachNineTotal,
          mode: 'joint_each_9eok',
          deduction: 18 * EOK,
          eachNineTotal,
          specialTotal: specialRes.totalTax,
          fairRatio
        }
      : Object.assign({
          mode: 'joint_special_1house',
          deduction: oneHouseDeduction,
          eachNineTotal,
          specialTotal: specialRes.totalTax,
          fairRatio
        }, specialRes);

    return chosen;
  }

  /**
   * 4. 증여세 & 증여 취득세 & 10년 이월과세 판정
   */
  function calcGiftTaxAndAcqTax(p) {
    const giftValue = Math.max(0, p.giftValue || 0); // 증여 지분 시가
    const publicPriceOfGift = Math.max(0, p.publicPriceOfGift !== undefined ? p.publicPriceOfGift : Math.round(giftValue * 0.69));
    const recipient = p.recipient || 'spouse'; // 'spouse' | 'adult_child' | 'minor_child'
    const marriageChildDeduction = Boolean(p.marriageChildDeduction); // 혼인·출산 1억 추가
    const priorGift10Y = Math.max(0, p.priorGift10Y || 0);
    const donorHouseCount = Math.max(1, p.donorHouseCount || 1);
    const isRegulated = Boolean(p.isRegulated);
    const over85m2 = Boolean(p.over85m2);
    const plannedHoldAfterGiftYears = p.plannedHoldAfterGiftYears !== undefined ? p.plannedHoldAfterGiftYears : 5;

    let deduction = 5000 * MAN;
    if (recipient === 'spouse') deduction = 6 * EOK;
    else if (recipient === 'minor_child') deduction = 2000 * MAN;
    else if (recipient === 'adult_child' && marriageChildDeduction) deduction += 1 * EOK;

    const totalGiftBase = giftValue + priorGift10Y;
    const taxBase = Math.max(0, totalGiftBase - deduction);

    let giftTax = 0;
    if (taxBase >= 50 * MAN) {
      const brackets = [
        [1 * EOK, 0.10, 0],
        [5 * EOK, 0.20, 1000 * MAN],
        [10 * EOK, 0.30, 6000 * MAN],
        [30 * EOK, 0.40, 16000 * MAN],
        [Infinity, 0.50, 46000 * MAN]
      ];
      for (let i = 0; i < brackets.length; i++) {
        if (taxBase <= brackets[i][0]) {
          const calc = Math.floor(taxBase * brackets[i][1] - brackets[i][2]);
          giftTax = Math.floor(calc * 0.97); // 기한 내 신고세액공제 3%
          break;
        }
      }
    }

    // 증여 취득세: 조정대상지역 + 공시 3억 이상 + 다주택자 증여 시 12% (+0.4% 지방교육세 + 1.0% 농특세)
    const isHeavyAcq = donorHouseCount >= 2 && isRegulated && publicPriceOfGift >= 3 * EOK;
    const acqRate = isHeavyAcq
      ? (over85m2 ? 0.134 : 0.124)
      : (over85m2 ? 0.040 : 0.038);
    const acquisitionTax = Math.floor(giftValue * acqRate);

    const carryoverRisk = plannedHoldAfterGiftYears < 10;

    return {
      giftValue,
      deduction,
      taxBase,
      giftTax,
      isHeavyAcq,
      acqRate,
      acquisitionTax,
      totalUpfrontCost: giftTax + acquisitionTax,
      carryoverRisk
    };
  }

  /**
   * 5. 건강보험 피부양자 탈락 판정 & 지역가입자 월 건보료 산정 (2026년 확정 기준)
   */
  function calcHealthInsurance(p) {
    const publicIncome = Math.max(0, p.publicPensionIncome || 0); // 공적연금 (전액)
    const earnedIncome = Math.max(0, p.earnedIncome || 0); // 근로소득
    const rentalIncome = Math.max(0, p.rentalIncome || 0); // 주택임대소득 등 사업소득
    const financialIncome = Math.max(0, p.financialIncome || 0); // 이자·배당소득
    const otherIncome = Math.max(0, p.otherIncome || 0); // 기타소득
    const hasBusinessReg = Boolean(p.hasBusinessReg);
    const propertyTaxBase = Math.max(0, p.propertyTaxBase || 0); // 재산세 과세표준 합계
    const isOneHouse = p.isOneHouse !== undefined ? Boolean(p.isOneHouse) : true;
    const housingLoan = Math.max(0, p.housingLoan || 0);

    // 피부양자 판정용 합산소득: 이자·배당 1,000만 초과 시 전액, 이하 0원. 연금/근로 100% 반영!
    const finForDep = financialIncome > 1000 * MAN ? financialIncome : 0;
    const depTotalIncome = publicIncome + earnedIncome + rentalIncome + finForDep + otherIncome;

    const reasons = [];
    if (depTotalIncome > 2000 * MAN) {
      reasons.push('연간 합산소득 2,000만 원 초과');
    }
    if (rentalIncome > 0 && (hasBusinessReg || rentalIncome > 0)) {
      // 주택임대소득은 등록 여부와 무관하게 탈락 사유
      reasons.push('주택임대(사업)소득 발생');
    } else if (hasBusinessReg && otherIncome > 0) {
      reasons.push('사업자등록자 사업소득 발생');
    }
    if (propertyTaxBase > 9 * EOK) {
      reasons.push('재산세 과세표준 9억 원 초과 (소득 무관 탈락)');
    } else if (propertyTaxBase > 5.4 * EOK && depTotalIncome > 1000 * MAN) {
      reasons.push('재산세 과세표준 5.4억 원 초과 & 연 소득 1,000만 원 초과');
    }

    const isDependentDisqualified = reasons.length > 0;

    // 지역가입자 전환 시 월 보험료 산정
    // 소득 평가: 사업·금융(1천초과시)·기타 100%, 근로·공적연금 50%
    const evalAnnualIncome = rentalIncome + finForDep + otherIncome + Math.floor((publicIncome + earnedIncome) * 0.5);
    const monthlyIncomeBase = evalAnnualIncome / 12;
    const incomePremium = Math.floor(monthlyIncomeBase * 0.0719);

    // 재산 평가: 기본공제 1억 원 + (1세대 1주택 주택담보대출 공제 최대 5,000만 원)
    const loanDed = isOneHouse ? Math.min(5000 * MAN, housingLoan) : 0;
    const netPropBase = Math.max(0, propertyTaxBase - 1 * EOK - loanDed);
    const score = getPropertyScore(netPropBase);
    const propertyPremium = Math.floor(score * 211.5);

    let healthPremium = incomePremium + propertyPremium;
    healthPremium = Math.max(20160, Math.min(4591740, healthPremium));
    const longTermCarePremium = Math.floor(healthPremium * (0.009448 / 0.0719));
    const monthlyTotal = healthPremium + longTermCarePremium;

    return {
      depTotalIncome,
      propertyTaxBase,
      isDependentDisqualified,
      reasons,
      incomePremium,
      propertyPremium,
      score,
      healthPremium,
      longTermCarePremium,
      monthlyTotal,
      annualTotal: monthlyTotal * 12
    };
  }

  /**
   * 6. 5년(2026~2031) 4대 전략 시나리오 통합 시뮬레이션
   */
  function simulateFiveYears(rawInput) {
    const inp = Object.assign({
      houseCount: 1,
      currentPrice: 18 * EOK,      // 현재 시세
      buyPrice: 9 * EOK,           // 취득가
      publicPrice: 0,              // 공시가격 (0이면 시세 69% 자동 추정)
      holdingYears: 7,
      residenceYears: 0,
      isRegulated: true,
      isJointOwned: false,
      jointRatio: 0.5,
      age: 55,
      publicPensionIncome: 1200 * MAN,
      earnedIncome: 0,
      rentalIncome: 0,
      financialIncome: 300 * MAN,
      loanBalance: 2 * EOK,
      loanRate: 0.042,             // 연 4.2%
      priceGrowthRate: 0.02,       // 연 2.0%
      policyMode: 'current',       // 'current' | 'reform'
      compFairRatio: undefined,    // 커스텀 종부세 공정시장가액비율
      surchargeEnabled: true,
      giftTarget: 'spouse',        // 'spouse' | 'adult_child'
      giftShareRatio: 0.5          // 배우자 공동명의 50% 또는 자녀 증여 비율
    }, rawInput || {});

    const basePublicPrice = inp.publicPrice > 0 ? inp.publicPrice : Math.round(inp.currentPrice * 0.69);
    const expenses = Math.round(inp.buyPrice * 0.03);

    function runHoldPath(opts) {
      const years = [];
      let totalPropTax = 0;
      let totalCompTax = 0;
      let totalHealthIns = 0;
      let totalInterest = 0;
      let prevPropMain = undefined;
      let depLostAnyYear = false;
      let firstDepLostYear = null;

      for (let i = 0; i < 5; i++) {
        const yr = 2027 + i;
        const factor = Math.pow(1 + inp.priceGrowthRate, i + 1);
        const yrPrice = Math.round(inp.currentPrice * factor);
        const yrPublic = Math.round(basePublicPrice * factor);
        const yrHold = inp.holdingYears + i + 1;
        const yrRes = opts.liveIn ? inp.residenceYears + i + 1 : inp.residenceYears;

        const prop = calcPropertyTax({
          publicPrice: yrPublic,
          isOneHouse: inp.houseCount === 1,
          prevTax: prevPropMain
        });
        prevPropMain = prop.mainTax;

        const comp = calcComprehensiveRealEstateTax({
          publicPrice: yrPublic,
          houseCount: inp.houseCount,
          isJoint: opts.isJoint,
          jointRatio: inp.jointRatio,
          age: inp.age + i + 1,
          holdingYears: yrHold,
          residenceYears: yrRes,
          policyMode: inp.policyMode,
          year: yr,
          compFairRatio: inp.compFairRatio
        });

        // 공동명의 시 개인별 재산세 과표 분산 (약 50% 기준)
        const personPropBase = opts.isJoint ? Math.round(prop.taxBase * inp.jointRatio) : prop.taxBase;
        const nhi = calcHealthInsurance({
          publicPensionIncome: inp.publicPensionIncome,
          earnedIncome: inp.earnedIncome,
          rentalIncome: inp.rentalIncome,
          financialIncome: inp.financialIncome,
          propertyTaxBase: personPropBase,
          isOneHouse: inp.houseCount === 1,
          housingLoan: inp.loanBalance
        });

        if (nhi.isDependentDisqualified && !depLostAnyYear) {
          depLostAnyYear = true;
          firstDepLostYear = yr;
        }
        const yrHealth = nhi.isDependentDisqualified ? nhi.annualTotal : 0;
        const yrInterest = Math.round(inp.loanBalance * inp.loanRate);

        totalPropTax += prop.totalTax;
        totalCompTax += comp.totalTax;
        totalHealthIns += yrHealth;
        totalInterest += yrInterest;

        years.push({
          year: yr,
          price: yrPrice,
          publicPrice: yrPublic,
          propertyTax: prop.totalTax,
          compTax: comp.totalTax,
          healthIns: yrHealth,
          monthlyHealthIns: nhi.isDependentDisqualified ? nhi.monthlyTotal : 0,
          isDependentDisqualified: nhi.isDependentDisqualified,
          nhiReasons: nhi.reasons,
          interest: yrInterest
        });
      }

      const finalPrice = years[4].price;
      const finalCapGain = calcCapitalGainsTax({
        sellPrice: finalPrice,
        buyPrice: opts.carryoverBuyPrice !== undefined ? opts.carryoverBuyPrice : inp.buyPrice,
        expenses,
        holdingYears: inp.holdingYears + 5,
        residenceYears: opts.liveIn ? inp.residenceYears + 5 : inp.residenceYears,
        houseCount: inp.houseCount,
        isRegulated: inp.isRegulated,
        surchargeEnabled: inp.surchargeEnabled,
        policyMode: inp.policyMode,
        year: 2031
      });

      const upfrontCost = opts.upfrontCost || 0;
      const totalTax = upfrontCost + totalPropTax + totalCompTax + finalCapGain.totalTax;
      const totalCost = totalTax + totalHealthIns + totalInterest;
      const netWorth = finalPrice - inp.loanBalance - totalCost;

      return {
        id: opts.id,
        name: opts.name,
        shortName: opts.shortName,
        upfrontCost,
        totalPropTax,
        totalCompTax,
        capGainTax: finalCapGain.totalTax,
        totalTax,
        totalHealthIns,
        totalInterest,
        totalCost,
        finalPrice,
        netWorth,
        depLostAnyYear,
        firstDepLostYear,
        years,
        finalCapGain
      };
    }

    // 시나리오 A: 지금 매도 (2026 말 ~ 2027 초 처분 후 무주택 예금 운용 가정: 연 3.0% 세후 약 2.5% vs 대출 상환)
    const capNow = calcCapitalGainsTax({
      sellPrice: inp.currentPrice,
      buyPrice: inp.buyPrice,
      expenses,
      holdingYears: inp.holdingYears,
      residenceYears: inp.residenceYears,
      houseCount: inp.houseCount,
      isRegulated: inp.isRegulated,
      surchargeEnabled: inp.surchargeEnabled,
      policyMode: inp.policyMode,
      year: 2026
    });
    const cashAfterSellNow = Math.max(0, inp.currentPrice - inp.loanBalance - capNow.totalTax);
    // 무주택 전환 시 5년간 예금이자 연 2.5%(세후) 복리, 건보료 피부양자 유지(보증금 등 별도 재산 없을 시 0원)
    const cash5Y = Math.round(cashAfterSellNow * Math.pow(1.025, 5));
    const scenarioA = {
      id: 'A',
      name: '시나리오 A · 지금 매도',
      shortName: '지금 매도',
      upfrontCost: capNow.totalTax,
      totalPropTax: 0,
      totalCompTax: 0,
      capGainTax: capNow.totalTax,
      totalTax: capNow.totalTax,
      totalHealthIns: 0,
      totalInterest: 0,
      totalCost: capNow.totalTax,
      finalPrice: cash5Y + inp.loanBalance,
      netWorth: cash5Y,
      depLostAnyYear: false,
      firstDepLostYear: null,
      years: [2027, 2028, 2029, 2030, 2031].map((yr, idx) => ({
        year: yr,
        price: Math.round(cashAfterSellNow * Math.pow(1.025, idx + 1)),
        publicPrice: 0,
        propertyTax: 0,
        compTax: 0,
        healthIns: 0,
        monthlyHealthIns: 0,
        isDependentDisqualified: false,
        nhiReasons: [],
        interest: 0
      })),
      finalCapGain: capNow
    };

    // 시나리오 B: 그대로 5년 보유 후 매도
    const scenarioB = runHoldPath({
      id: 'B',
      name: '시나리오 B · 현 상태 5년 보유',
      shortName: '현상태 보유',
      liveIn: false,
      isJoint: inp.isJointOwned
    });

    // 시나리오 C: 실거주 전환 후 5년 보유·매도
    const scenarioC = runHoldPath({
      id: 'C',
      name: '시나리오 C · 실거주 전환 보유',
      shortName: '실거주 전환',
      liveIn: true,
      isJoint: inp.isJointOwned
    });

    // 시나리오 D: 부부 공동명의 변경(50%) 또는 자녀 사전증여 후 5년 보유·매도
    const giftVal = Math.round(inp.currentPrice * inp.giftShareRatio);
    const giftRes = calcGiftTaxAndAcqTax({
      giftValue: giftVal,
      publicPriceOfGift: Math.round(basePublicPrice * inp.giftShareRatio),
      recipient: inp.giftTarget === 'child' ? 'adult_child' : 'spouse',
      donorHouseCount: inp.houseCount,
      isRegulated: inp.isRegulated,
      plannedHoldAfterGiftYears: 5
    });
    const scenarioD = runHoldPath({
      id: 'D',
      name: inp.giftTarget === 'child' ? '시나리오 D · 자녀 사전증여 후 보유' : '시나리오 D · 부부 공동명의 변경 후 보유',
      shortName: inp.giftTarget === 'child' ? '자녀 증여' : '공동명의 변경',
      liveIn: inp.residenceYears >= 2,
      isJoint: inp.giftTarget !== 'child',
      upfrontCost: giftRes.totalUpfrontCost,
      carryoverBuyPrice: inp.buyPrice // 5년 보유 후 매도 시 10년 이내 이월과세 적용!
    });
    scenarioD.giftDetail = giftRes;

    const scenarios = [scenarioA, scenarioB, scenarioC, scenarioD];
    const sorted = scenarios.slice().sort((a, b) => b.netWorth - a.netWorth);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const maxGap = best.netWorth - worst.netWorth;

    // 경보 배지 3종
    const curProp = calcPropertyTax({ publicPrice: basePublicPrice, isOneHouse: inp.houseCount === 1 });
    const curNhi = calcHealthInsurance({
      publicPensionIncome: inp.publicPensionIncome,
      earnedIncome: inp.earnedIncome,
      rentalIncome: inp.rentalIncome,
      financialIncome: inp.financialIncome,
      propertyTaxBase: inp.isJointOwned ? Math.round(curProp.taxBase * inp.jointRatio) : curProp.taxBase,
      isOneHouse: inp.houseCount === 1,
      housingLoan: inp.loanBalance
    });

    const dependentLossRisk = curNhi.isDependentDisqualified || scenarioB.depLostAnyYear;
    const taxSpikeRisk = inp.policyMode === 'reform' || (inp.houseCount >= 2 && inp.isRegulated) || scenarioB.totalCompTax > 1000 * MAN;
    const giftCarryoverRisk = giftRes.carryoverRisk;

    // 세무사 상담 질문 10선 동적 생성
    const taxQuestions = [
      `현재 시세 ${(inp.currentPrice / EOK).toFixed(1)}억 원(${inp.houseCount}주택) 기준, 2026년 5월 10일 이후 다주택 중과 또는 2027~2029년 개편안 적용 시 실제 양도세 실효세율 차이는 얼마입니까?`,
      `재산세 과세표준이 약 ${(curProp.taxBase / MAN).toLocaleString()}만 원으로 추정되는데, 본인 및 배우자의 건보료 피부양자 자격(${curNhi.isDependentDisqualified ? '현재 탈락 위험' : '유지 구간'}) 방어를 위한 지분 분산 효과가 있습니까?`,
      `부부 공동명의 전환 시 취득세·증여세 초기 비용(${Math.round(giftRes.totalUpfrontCost / MAN).toLocaleString()}만 원) 대비 향후 5년 종부세·건보료 절감액의 손익분기점이 몇 년입니까?`,
      `배우자·직계존비속 증여 후 10년 이내 매도 시 적용되는 양도소득세 이월과세(원 취득가액 ${(inp.buyPrice / EOK).toFixed(1)}억 적용)를 피하려면 언제까지 보유해야 합니까?`,
      `실거주 요건(2년 이상) 충족 여부에 따라 장기보유특별공제가 최대 80% vs 일반 30%(개편 시 0%)로 갈리는데, 전입 시점별 가장 유리한 매도 타이밍은 언제입니까?`,
      `1세대 1주택 종부세 특례(12억 공제+고령자·장기보유 세액공제)와 부부 공동명의 각자 9억 공제 중 만 ${inp.age}세·보유 ${inp.holdingYears}년 기준 어느 쪽이 유리합니까?`,
      `필요경비(취득세·중개보수·자본적 지출) 증빙으로 추가 인정받아 양도차익을 줄일 수 있는 항목이 얼마나 됩니까?`,
      `대출 잔액 ${(inp.loanBalance / EOK).toFixed(1)}억 원에 대해 1주택자 지역건보료 주택담보대출 공제(최대 5,000만 원) 신고가 누락되지 않았습니까?`,
      `임대소득·금융소득(이자·배당) 합산이 연 1,000만~2,000만 원 경계에 걸쳐 있을 때 연금 수령 시기 조절로 건보료를 줄일 수 있습니까?`,
      `2027~2029년 세제개편안 국회 통과 여부에 따라 매도 계약일·잔금일 기준 경과규정 혜택을 받으려면 언제까지 계약해야 유리합니까?`
    ];

    return {
      input: inp,
      basePublicPrice,
      currentPropertyTax: curProp,
      currentHealthInsurance: curNhi,
      scenarios,
      best,
      worst,
      maxGap,
      badges: {
        dependentLossRisk,
        taxSpikeRisk,
        giftCarryoverRisk
      },
      taxQuestions
    };
  }

  return {
    calcCapitalGainsTax,
    calcPropertyTax,
    calcComprehensiveRealEstateTax,
    calcGiftTaxAndAcqTax,
    calcHealthInsurance,
    simulateFiveYears,
    getPropertyScore
  };
});
