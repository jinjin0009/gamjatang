# 감자탕 감별사 (BONE CLUB)

**FIND YOUR TANG.** — 전국 감자탕 맛집 지도, 감자탕 MBTI, 감자탕 월드컵, 방문 도장깨기, 게임처럼 XP를 주는 후기.

- 사이트: https://gamjatang-club.vercel.app/ (Vercel 무료 요금제, main 에 push 하면 자동 배포)
  - 예전 주소 https://jinjin0009.github.io/gamjatang/ 로 들어오면 새 주소로 넘어가요.
- 가게 정보: 소상공인시장진흥공단 상가(상권)정보(공공데이터포털) + © OpenStreetMap contributors (ODbL) — 4,844곳
- 평점·후기·도장은 사이트 사용자 기록으로만 계산 (지금은 프로토타입이라 각 브라우저에만 저장)

## 구성

| 경로 | 내용 |
|---|---|
| `index.html`, `js/`, `css/` | 사이트 본체 (빌드 없이 바로 열리는 HTML·CSS·JS) |
| `js/data-real.js` | 수집한 실제 감자탕 가게 데이터 (자동 생성) |
| `r/`, `region/`, `faq.html`, `mbti.html` | 검색엔진·AI 답변용 정적 페이지 (자동 생성) |
| `sitemap.xml`, `robots.txt`, `llms.txt` | 검색엔진·AI 크롤러 안내 파일 (자동 생성) |
| `tools/` | 데이터 수집·페이지 생성 프로그램 |

> 검색엔진은 `robots.txt` 와 `llms.txt` 를 **도메인 맨 위**에서만 읽어요. Vercel 주소에서는 이 저장소의 파일이 바로 맨 위에 있어요.
> 예전 GitHub Pages 주소용 파일은 [`jinjin0009/jinjin0009.github.io`](https://github.com/jinjin0009/jinjin0009.github.io) 저장소에 있어요.

## 데이터 갱신

```bash
node tools/collect-osm.mjs      # 1) OpenStreetMap 에서 감자탕 가게 다시 수집
node tools/enrich-address.mjs   # 2) 빠진 주소 채우기
node tools/collect-sbiz.mjs     # 3) 공공데이터포털 상가정보와 합치기 (tools/sbiz/ 에 zip 풀어 두기)
node tools/build-seo.mjs        # 4) 검색엔진용 페이지·sitemap 다시 만들기
```

## 로컬 실행

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8090
```
