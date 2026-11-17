# seller-margin-pseo — 빌드 소스

이 폴더는 <https://doggonug-cpu.github.io/seller-margin-pseo/> 로 배포되는 pSEO 계산기 사이트의 **소스**입니다.
배포되는 파일(index.html, `채널슬러그/index.html`, sitemap.xml, robots.txt, assets/)은 모두 아래 명령으로 데이터에서 생성됩니다. 직접 고치지 말고 데이터를 고친 뒤 다시 생성하세요. (`_`로 시작하는 이 폴더는 GitHub Pages에 게시되지 않습니다.)

## 구조

```
_src/
  build.py                 생성기 (표준 라이브러리만 사용)
  templates/layout.html    공통 레이아웃 (__TITLE__ 등 토큰 치환)
  assets/style.css         스타일 (외부 CDN 없음)
  assets/calc.js           계산기 위젯 (브라우저에서만 계산)
  assets/og.png            소셜 카드 이미지
  tools/make_og.py         og.png 재생성
  data/site.json           사이트 메타·허브 FAQ·그룹 정의
  data/channels/*.json     채널별 수수료·기본값·FAQ·출처
```

## 자주 하는 작업

```bash
# 페이지 재생성 + 검증 (저장소 루트에서)
python3 seller-margin-pseo/_src/build.py --check

# 다른 경로/도메인으로 빌드
python3 seller-margin-pseo/_src/build.py --out /tmp/out --base-url https://example.com/x
```

채널을 추가하려면 `data/channels/` 의 JSON 배열에 항목을 하나 더 넣고 다시 생성하면 허브 비교표·sitemap·내부 링크가 함께 갱신됩니다.

## 데이터 필드

| 필드 | 설명 |
|---|---|
| `fees.commission_pct` | 채널 수수료율(%). 부가세 별도 공시 요율이면 `commission_vat: true` |
| `fees.commission_tiers` | 구간 누진 요율 `[[상한, 요율], ...]`. 마지막 상한은 `0`(무한) |
| `fees.payment_pct` / `payment_base` | 결제·PG 수수료. `payment_base`는 `gross`(결제액) / `price`(판매가) / `shipping`(배송비만) |
| `fees.fixed_per_order` | 건당 고정비(로켓그로스 물류비, 숨고 견적비 등) |
| `fees.monthly_fee` | 월 고정비(쿠팡 서비스 이용료, 솔루션 요금) |
| `fees.withholding_pct` | 원천징수율(프리랜서 3.3 등) |
| `vat_mode` | `general`(일반과세) / `simplified`(간이과세, `vat_simplified_pct`) / `none` |
| `defaults` | 계산기 초기값(판매가·원가·배송비·광고비·반품률·월 건수·목표 마진) |

## 검증

`build.py --check` 는 다음을 확인하고 실패 시 0이 아닌 코드를 반환합니다(CI에서 배포 중단).

- 페이지 수, 채널 필수 필드, FAQ 4개 이상, 함정 3개 이상
- title 70자 이하, description 60~165자, 채널 간 중복 없음
- 페이지당 h1 1개, 계산기 위젯 존재, `http://` 링크 없음
- 허브에서 모든 채널 링크, sitemap·robots·assets 존재

## 요율 갱신 규칙

1. 각 플랫폼 공개 자료(판매자 안내·약관·요금표)를 확인하고 `data/channels/*.json` 의 `fees`·`fee_rows`·`sources`를 고칩니다.
2. `data/site.json` 의 `updated` / `updated_ko` 를 오늘 날짜로 바꿉니다(사이트 전체 갱신 표시).
3. 빌드 → 커밋. GitHub Actions가 매주 월요일 09:00 KST에 자동 재생성합니다.

요율을 추정으로 넣는 경우(예: 비공개 플랫폼) 반드시 `fee_basis`와 페이지 문안에 추정임을 적습니다.
