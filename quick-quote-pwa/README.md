# QuickQuote — 간편견적

10초 만에 끝나는 **견적서 · 거래명세서 · 간이영수증**. 서버도, 회원가입도, 결제도 없이 브라우저에서 바로 작성하고 PDF로 저장하는 초경량 PWA입니다.

> Make a quotation, statement of transaction or receipt in about ten seconds, then print or save it as PDF. No account, no server-side storage — a single static folder.

- **라이브**: https://doggonug-cpu.github.io/quick-quote-pwa/
- **영문 모드**: https://doggonug-cpu.github.io/quick-quote-pwa/?lang=en
- **기술**: 순수 HTML/CSS/JavaScript (빌드 도구·프레임워크·외부 CDN 없음)

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 문서 3종 | 견적서 · 거래명세서 · 간이영수증 (문서번호 접두어 자동: Q / S / R) |
| 자동 계산 | 품목 수량×단가, 할인, 부가세 **별도·포함·없음**, 세율 직접 지정 |
| 다중 통화 | KRW·USD·EUR·JPY 등 20종, 통화별 소수 자릿수 자동 처리 |
| 인쇄 / PDF | A4 규격 전용 인쇄 스타일시트. 인쇄 창에서 ‘PDF로 저장’ |
| 한/영 전환 | 상단 토글 + `?lang=en` URL, `<html lang>`·제목·메타까지 전환 |
| 오프라인 | Service Worker 캐시. 첫 방문 후 비행기 모드에서도 작성 가능 |
| 설치 | 홈 화면 추가(standalone), 바로가기 3종(`?type=`) |
| 보관함 | 작성 문서를 브라우저 localStorage에 저장·불러오기·삭제 |
| 공유 | Web Share API, 미지원 시 요약 텍스트 복사 |

## 파일 구조

```
quick-quote-pwa/
├── index.html            # 마크업 + SEO/OG/JSON-LD 메타
├── styles.css            # 앱 UI + A4 문서 + 인쇄 스타일
├── app.js                # 상태·계산·렌더·i18n·저장 (CONFIG 상단)
├── sw.js                 # 오프라인 캐시 (VERSION 올리면 갱신)
├── manifest.webmanifest  # PWA 매니페스트
├── icons/                # 192·512·maskable·apple-touch·favicon.svg
├── og-image.png          # 1200×630 소셜 카드
├── robots.txt · sitemap.xml
```

## Pro 전환 지점 (결제 연동 시)

결제 연동 전이라 **가짜 결제창·허위 과금은 넣지 않았습니다.** 모든 핵심 기능은 지금 무료로 완전히 동작합니다.

`app.js` 최상단 `CONFIG` 두 값만 채우면 상단의 Pro 카드가 실제 전환 지점이 됩니다.

```js
var CONFIG = {
  proCheckoutUrl: '',   // 예: 'https://YOURSTORE.lemonsqueezy.com/checkout/buy/0000-...'
  proWaitlistEmail: ''  // 예: 'hello@quickquote.app' (출시 알림 mailto 수신)
};
```

- `proCheckoutUrl`이 있으면 → Pro 버튼이 해당 결제 페이지로 이동
- `proWaitlistEmail`만 있으면 → 출시 알림 메일 작성 창(mailto)
- 둘 다 비어 있으면 → “Pro는 준비 중” 안내 토스트

## 개인정보

입력한 상호·고객·금액은 **브라우저 localStorage에만** 저장되며 어떤 서버로도 전송되지 않습니다. 앱은 외부 요청을 전혀 보내지 않습니다(폰트·아이콘 포함 전부 자체 호스팅).

## 배포

`doggonug-cpu/doggonug-cpu.github.io` 저장소의 `quick-quote-pwa/` 폴더로 배포됩니다(GitHub Pages, 서브 경로). 별도 빌드 단계 없음 — 파일을 그대로 푸시하면 반영됩니다.

2026 · QuickQuote
