# 감자탕 감별사야 (BONE CLUB)

**FIND YOUR TANG.** — 전국 감자탕 맛집 지도, 감자탕 MBTI, 감자탕 월드컵, 방문 도장깨기, 게임처럼 XP를 주는 후기.

- 사이트: https://jinjin0009.github.io/gamjatang/
- 가게 정보: © OpenStreetMap contributors (ODbL) — 649곳
- 평점·후기·도장은 사이트 사용자 기록으로만 계산 (지금은 프로토타입이라 각 브라우저에만 저장)

## 구성

| 경로 | 내용 |
|---|---|
| `index.html`, `js/`, `css/` | 사이트 본체 (빌드 없이 바로 열리는 HTML·CSS·JS) |
| `js/data-real.js` | 수집한 실제 감자탕 가게 데이터 (자동 생성) |
| `r/`, `region/`, `faq.html`, `mbti.html` | 검색엔진·AI 답변용 정적 페이지 (자동 생성) |
| `sitemap.xml`, `robots.txt`, `llms.txt` | 검색엔진·AI 크롤러 안내 파일 (자동 생성) |
| `tools/` | 데이터 수집·페이지 생성 프로그램 |

## 데이터 갱신

```bash
node tools/collect-osm.mjs      # 1) OpenStreetMap 에서 감자탕 가게 다시 수집
node tools/enrich-address.mjs   # 2) 빠진 주소 채우기
node tools/build-seo.mjs        # 3) 검색엔진용 페이지·sitemap 다시 만들기
```

## 로컬 실행

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8090
```
