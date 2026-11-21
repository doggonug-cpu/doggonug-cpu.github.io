/* 톡송장 3초 — Pro 라이선스 키 검증 + 무료 5건 한도
 *
 * 키 형식: TS3.<본문 base64url>.<서명 base64url>
 *   본문 = {"v":1,"id":"TS3-20261121-0001","plan":"month","exp":"2026-12-21","iat":"2026-11-21","sub":"입금자명 또는 이메일"}
 *   서명 = ECDSA P-256 / SHA-256, r||s 64바이트 (IEEE P1363 형식)
 *
 * 브라우저에는 공개키만 들어갑니다. 이 파일에는 서명용 개인키가 없습니다.
 * 개인키는 저장소 밖 로컬 파일(projects/toksongjang-license/license_private_key.pem)에만
 * 있고, GitHub 공개 저장소에는 절대 올라가지 않습니다. 키 발급은
 * scripts/generate_license_key.py 로 10초 안에 합니다.
 *
 * 의존성 0개. 브라우저에서는 window.TalkLicense, Node/QuickJS에서는 module.exports.
 * 서명 검증은 Web Crypto가 없는 환경(로컬 테스트 러너 등)에서도 같게 동작하도록
 * 순수 JS(BigInt)로 구현했습니다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  if (root) { root.TalkLicense = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PREFIX = 'TS3';
  var STORE_KEY = 'ts3.license.v1';
  var FORMAT_KEY = 'ts3.format.v1';
  var FREE_LIMIT = 5;

  /* 공개키 (P-256, 좌표 16진수). 개인키가 아니므로 공개되어도 안전합니다. */
  var PUBLIC_KEY = {
    x: 'ca2fddaed7563261f6493a4b3af38114441514a7f6b981b24081dc4dac80b202',
    y: '6180169b0ba3994abdb5b1eb41d0fd7bbf179074a43eeb0cf5503127349dcac7'
  };

  /* ── 바이트·문자 ─────────────────────────────────────────── */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function b64uEncode(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i];
      var b1 = i + 1 < bytes.length ? bytes[i + 1] : null;
      var b2 = i + 2 < bytes.length ? bytes[i + 2] : null;
      out += B64.charAt(b0 >> 2);
      out += B64.charAt(((b0 & 3) << 4) | (b1 === null ? 0 : b1 >> 4));
      if (b1 === null) { break; }
      out += B64.charAt(((b1 & 15) << 2) | (b2 === null ? 0 : b2 >> 6));
      if (b2 === null) { break; }
      out += B64.charAt(b2 & 63);
    }
    return out;
  }

  function b64uDecode(text) {
    if (typeof text !== 'string') { return null; }
    var clean = text.replace(/=+$/, '');
    if (!clean.length) { return null; }
    var out = [];
    var acc = 0;
    var bits = 0;
    for (var i = 0; i < clean.length; i++) {
      var val = B64.indexOf(clean.charAt(i));
      if (val < 0) { return null; }
      acc = ((acc << 6) | val) & 0xffffff;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out.push((acc >>> bits) & 255);
        acc = acc & ((1 << bits) - 1);
      }
    }
    // 6비트가 통째로 남는 것은 잘못된 길이입니다(2·4비트 꼬리는 base64url 패딩).
    if (bits === 6) { return null; }
    return new Uint8Array(out);
  }

  function utf8Encode(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
        var next = text.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          var cp = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
          i += 1;
        } else {
          bytes.push(0xef, 0xbf, 0xbd);
        }
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
      }
    }
    return new Uint8Array(bytes);
  }

  function utf8Decode(bytes) {
    var out = '';
    var i = 0;
    while (i < bytes.length) {
      var b0 = bytes[i];
      if (b0 < 0x80) { out += String.fromCharCode(b0); i += 1; continue; }
      if (b0 >= 0xc0 && b0 < 0xe0 && i + 1 < bytes.length) {
        out += String.fromCharCode(((b0 & 31) << 6) | (bytes[i + 1] & 63));
        i += 2; continue;
      }
      if (b0 >= 0xe0 && b0 < 0xf0 && i + 2 < bytes.length) {
        out += String.fromCharCode(((b0 & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63));
        i += 3; continue;
      }
      if (b0 >= 0xf0 && i + 3 < bytes.length) {
        var cp = ((b0 & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63);
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
        i += 4; continue;
      }
      return null;
    }
    return out;
  }

  function asciiBytes(text) {
    var out = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) { out[i] = text.charCodeAt(i) & 255; }
    return out;
  }

  /* ── SHA-256 ─────────────────────────────────────────────── */
  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var len = bytes.length;
    var bitLen = len * 8;
    var total = len + 9;
    total += (64 - (total % 64)) % 64;
    var buf = new Uint8Array(total);
    buf.set(bytes, 0);
    buf[len] = 0x80;
    var hi = Math.floor(bitLen / 0x100000000);
    var lo = bitLen >>> 0;
    buf[total - 8] = (hi >>> 24) & 255;
    buf[total - 7] = (hi >>> 16) & 255;
    buf[total - 6] = (hi >>> 8) & 255;
    buf[total - 5] = hi & 255;
    buf[total - 4] = (lo >>> 24) & 255;
    buf[total - 3] = (lo >>> 16) & 255;
    buf[total - 2] = (lo >>> 8) & 255;
    buf[total - 1] = lo & 255;

    var w = new Array(64);
    for (var off = 0; off < total; off += 64) {
      var i;
      for (i = 0; i < 16; i++) {
        w[i] = ((buf[off + i * 4] << 24) | (buf[off + i * 4 + 1] << 16) | (buf[off + i * 4 + 2] << 8) | buf[off + i * 4 + 3]) | 0;
      }
      for (i = 16; i < 64; i++) {
        var x = w[i - 15];
        var y = w[i - 2];
        var s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        var s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    var digest = new Uint8Array(32);
    for (var j = 0; j < 8; j++) {
      digest[j * 4] = (H[j] >>> 24) & 255;
      digest[j * 4 + 1] = (H[j] >>> 16) & 255;
      digest[j * 4 + 2] = (H[j] >>> 8) & 255;
      digest[j * 4 + 3] = H[j] & 255;
    }
    return digest;
  }

  /* ── P-256 (secp256r1) 검증 ──────────────────────────────── */
  var CURVE = {
    p: BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
    b: BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
    n: BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
    gx: BigInt('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),
    gy: BigInt('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5')
  };
  CURVE.a = CURVE.p - 3n;

  function mod(a, m) { var r = a % m; return r < 0n ? r + m : r; }

  function invMod(a, m) {
    var r0 = m;
    var r1 = mod(a, m);
    var s0 = 0n;
    var s1 = 1n;
    while (r1 !== 0n) {
      var q = r0 / r1;
      var r2 = r0 - q * r1;
      r0 = r1; r1 = r2;
      var s2 = s0 - q * s1;
      s0 = s1; s1 = s2;
    }
    if (r0 !== 1n) { return null; }
    return mod(s0, m);
  }

  function biFromBytes(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      var h = bytes[i].toString(16);
      hex += h.length === 1 ? '0' + h : h;
    }
    return BigInt('0x' + (hex || '0'));
  }

  /* 야코비안 좌표: 점 덧셈·2배에 역원을 쓰지 않고 마지막에 한 번만 씁니다. */
  function jDouble(P) {
    if (!P || P.Z === 0n) { return null; }
    var p = CURVE.p;
    if (P.Y === 0n) { return null; }
    var YY = mod(P.Y * P.Y, p);
    var S = mod(4n * P.X * YY, p);
    var Z2 = mod(P.Z * P.Z, p);
    var M = mod(3n * P.X * P.X + CURVE.a * mod(Z2 * Z2, p), p);
    var X3 = mod(M * M - 2n * S, p);
    var YYYY = mod(YY * YY, p);
    var Y3 = mod(M * (S - X3) - 8n * YYYY, p);
    var Z3 = mod(2n * P.Y * P.Z, p);
    return { X: X3, Y: Y3, Z: Z3 };
  }

  function jAdd(P, Q) {
    if (!P || P.Z === 0n) { return Q; }
    if (!Q || Q.Z === 0n) { return P; }
    var p = CURVE.p;
    var Z1Z1 = mod(P.Z * P.Z, p);
    var Z2Z2 = mod(Q.Z * Q.Z, p);
    var U1 = mod(P.X * Z2Z2, p);
    var U2 = mod(Q.X * Z1Z1, p);
    var S1 = mod(P.Y * Q.Z * Z2Z2, p);
    var S2 = mod(Q.Y * P.Z * Z1Z1, p);
    if (U1 === U2) {
      if (S1 !== S2) { return null; }
      return jDouble(P);
    }
    var H = mod(U2 - U1, p);
    var R = mod(S2 - S1, p);
    var HH = mod(H * H, p);
    var HHH = mod(H * HH, p);
    var V = mod(U1 * HH, p);
    var X3 = mod(R * R - HHH - 2n * V, p);
    var Y3 = mod(R * (V - X3) - S1 * HHH, p);
    var Z3 = mod(H * P.Z * Q.Z, p);
    return { X: X3, Y: Y3, Z: Z3 };
  }

  function jMul(k, x, y) {
    var R = null;
    var Q = { X: x, Y: y, Z: 1n };
    while (k > 0n) {
      if ((k & 1n) === 1n) { R = jAdd(R, Q); }
      Q = jDouble(Q);
      k >>= 1n;
    }
    return R;
  }

  function jAffine(P) {
    if (!P || P.Z === 0n) { return null; }
    var p = CURVE.p;
    var zi = invMod(P.Z, p);
    if (zi === null) { return null; }
    var zi2 = mod(zi * zi, p);
    return [mod(P.X * zi2, p), mod(P.Y * zi2 * zi, p)];
  }

  function onCurve(x, y) {
    var p = CURVE.p;
    if (x < 0n || x >= p || y < 0n || y >= p) { return false; }
    return mod(y * y, p) === mod(x * x * x + CURVE.a * x + CURVE.b, p);
  }

  var PUB_X = biFromBytes(hexToBytes(PUBLIC_KEY.x));
  var PUB_Y = biFromBytes(hexToBytes(PUBLIC_KEY.y));

  function hexToBytes(hex) {
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return out;
  }

  /* ECDSA P-256 / SHA-256 검증. msgBytes 위의 r||s(64바이트) 서명. */
  function verifySignature(msgBytes, sigBytes) {
    if (!sigBytes || sigBytes.length !== 64) { return false; }
    if (!onCurve(PUB_X, PUB_Y)) { return false; }
    var n = CURVE.n;
    var r = biFromBytes(sigBytes.subarray(0, 32));
    var s = biFromBytes(sigBytes.subarray(32, 64));
    if (r <= 0n || r >= n || s <= 0n || s >= n) { return false; }
    var e = biFromBytes(sha256(msgBytes));
    var w = invMod(s, n);
    if (w === null) { return false; }
    var u1 = mod(e * w, n);
    var u2 = mod(r * w, n);
    var sum = jAdd(jMul(u1, CURVE.gx, CURVE.gy), jMul(u2, PUB_X, PUB_Y));
    var point = jAffine(sum);
    if (!point) { return false; }
    return mod(point[0], n) === r;
  }

  /* ── 날짜 ────────────────────────────────────────────────── */
  function seoulDate(nowMs) {
    var ms = (typeof nowMs === 'number' && isFinite(nowMs)) ? nowMs : Date.now();
    return new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);
  }

  function dayNumber(dateText) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateText || ''));
    if (!m) { return null; }
    var y = Number(m[1]);
    var mo = Number(m[2]);
    var d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) { return null; }
    var ms = Date.UTC(y, mo - 1, d);
    var check = new Date(ms);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) { return null; }
    return Math.floor(ms / 86400000);
  }

  function daysBetween(fromText, toText) {
    var a = dayNumber(fromText);
    var b = dayNumber(toText);
    if (a === null || b === null) { return null; }
    return b - a;
  }

  var PLAN_LABEL = { month: '1개월', quarter: '3개월', half: '6개월', trial: '체험' };

  function planLabel(plan) {
    if (!plan) { return ''; }
    return PLAN_LABEL[plan] || String(plan);
  }

  /* ── 키 평가 ─────────────────────────────────────────────── */
  function blankResult(status, reason) {
    return { status: status, token: '', plan: '', planLabel: '', exp: '', daysLeft: null, id: '', sub: '', reason: reason || '' };
  }

  function evaluateToken(token, nowMs) {
    if (!token || typeof token !== 'string' || !token.trim()) {
      return blankResult('none', '등록된 키가 없습니다');
    }
    var text = token.trim().replace(/\s+/g, '');
    var parts = text.split('.');
    if (parts.length !== 3) { return blankResult('invalid', '키 형식이 아닙니다(점 2개 필요)'); }
    if (parts[0].toUpperCase() !== PREFIX) { return blankResult('invalid', '톡송장 Pro 키가 아닙니다'); }

    var payloadBytes = b64uDecode(parts[1]);
    if (!payloadBytes) { return blankResult('invalid', '키 본문을 읽지 못했습니다'); }
    var payloadText = utf8Decode(payloadBytes);
    if (!payloadText) { return blankResult('invalid', '키 본문 인코딩이 잘못되었습니다'); }

    var payload;
    try { payload = JSON.parse(payloadText); } catch (err) { return blankResult('invalid', '키 본문이 JSON이 아닙니다'); }
    if (!payload || typeof payload !== 'object' || Number(payload.v) !== 1) {
      return blankResult('invalid', '지원하지 않는 키 버전입니다');
    }

    var expText = String(payload.exp || '');
    if (dayNumber(expText) === null) { return blankResult('invalid', '만료일이 없거나 형식이 다릅니다'); }

    var sigBytes = b64uDecode(parts[2]);
    if (!verifySignature(asciiBytes(parts[1]), sigBytes)) {
      return blankResult('invalid', '서명이 맞지 않습니다(키가 변조되었거나 다른 서비스 키)');
    }

    var today = seoulDate(nowMs);
    var out = {
      status: 'valid',
      token: text,
      plan: String(payload.plan || ''),
      planLabel: planLabel(payload.plan),
      exp: expText,
      daysLeft: daysBetween(today, expText),
      id: String(payload.id || ''),
      sub: String(payload.sub || ''),
      reason: ''
    };
    if (out.daysLeft < 0) {
      out.status = 'expired';
      out.reason = expText + '에 만료되었습니다';
    }
    return out;
  }

  /* ── 저장소 ──────────────────────────────────────────────── */
  function safeGet(storage, key) {
    try { return storage ? storage.getItem(key) : null; } catch (err) { return null; }
  }

  function safeSet(storage, key, value) {
    try {
      if (!storage) { return false; }
      storage.setItem(key, value);
      return true;
    } catch (err) { return false; }
  }

  function safeRemove(storage, key) {
    try { if (storage) { storage.removeItem(key); } } catch (err) { /* 무시 */ }
  }

  function readLicense(storage, nowMs) {
    var raw = safeGet(storage, STORE_KEY);
    if (!raw) { return blankResult('none', '이 브라우저에 등록된 키가 없습니다'); }
    return evaluateToken(raw, nowMs);
  }

  function saveLicense(storage, token, nowMs) {
    var result = evaluateToken(token, nowMs);
    if (result.status === 'valid' || result.status === 'expired') {
      if (!safeSet(storage, STORE_KEY, result.token)) {
        result.stored = false;
        result.reason = '브라우저 저장이 막혀 있습니다(시크릿 모드 등). 이 창을 닫으면 키가 지워집니다.';
      } else {
        result.stored = true;
      }
    } else {
      result.stored = false;
    }
    return result;
  }

  function clearLicense(storage) { safeRemove(storage, STORE_KEY); }

  function readFormat(storage) {
    var raw = safeGet(storage, FORMAT_KEY);
    if (!raw) { return null; }
    try {
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') { return null; }
      return obj;
    } catch (err) { return null; }
  }

  function saveFormat(storage, format) {
    if (!format || typeof format !== 'object') { return false; }
    try { return safeSet(storage, FORMAT_KEY, JSON.stringify(format)); } catch (err) { return false; }
  }

  function clearFormat(storage) { safeRemove(storage, FORMAT_KEY); }

  /* ── 무료 한도 ───────────────────────────────────────────── */
  function isPro(license) { return !!license && license.status === 'valid'; }

  /* Pro면 null(무제한), 아니면 5 */
  function limitFor(license) { return isPro(license) ? null : FREE_LIMIT; }

  function splitOrders(orders, license) {
    var list = orders || [];
    var limit = limitFor(license);
    var visible = limit === null ? list.length : Math.min(list.length, limit);
    return {
      limit: limit,
      pro: limit === null,
      total: list.length,
      visible: visible,
      locked: list.length - visible
    };
  }

  function exportRows(orders, license) {
    var split = splitOrders(orders, license);
    return (orders || []).slice(0, split.visible);
  }

  return {
    PREFIX: PREFIX,
    FREE_LIMIT: FREE_LIMIT,
    STORE_KEY: STORE_KEY,
    FORMAT_KEY: FORMAT_KEY,
    PUBLIC_KEY: PUBLIC_KEY,
    evaluateToken: evaluateToken,
    readLicense: readLicense,
    saveLicense: saveLicense,
    clearLicense: clearLicense,
    readFormat: readFormat,
    saveFormat: saveFormat,
    clearFormat: clearFormat,
    isPro: isPro,
    limitFor: limitFor,
    splitOrders: splitOrders,
    exportRows: exportRows,
    planLabel: planLabel,
    seoulDate: seoulDate,
    daysBetween: daysBetween,
    dayNumber: dayNumber,
    /* 테스트에서 검증 경로를 직접 확인할 때 씁니다. */
    _debug: {
      sha256: sha256,
      verifySignature: verifySignature,
      b64uDecode: b64uDecode,
      b64uEncode: b64uEncode,
      utf8Encode: utf8Encode,
      utf8Decode: utf8Decode,
      asciiBytes: asciiBytes,
      onCurve: onCurve,
      PUB_X: PUB_X,
      PUB_Y: PUB_Y
    }
  };
});
