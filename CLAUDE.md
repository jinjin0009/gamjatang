# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

감자탕 감별사 (BONE CLUB) — 사이트 이름은 "감자탕 감별사"("감별사야" 아님): 빌드 없는 HTML/CSS/JS 단일 페이지 앱(# 주소로 화면 전환). 백엔드 없음. 로그인·후기·도장은 localStorage(`bc_db_v1`)에만 저장(프로토타입).
배포: GitHub Pages `jinjin0009/gamjatang` (main, 루트) → https://jinjin0009.github.io/gamjatang/ . push 하면 1~2분 뒤 반영.

## 구조
- 스크립트 순서가 중요: `data-real.js` → `data.js` → `ui.js` → `store.js` → `app.js` → `pages/*.js`. 전역 변수 방식.
- `Router.add(path, render, {auth|admin})` 로 화면 등록. 상태 변경은 `Store.mutate()` 로 감싸야 미션·배지·레벨업 알림이 뜸.
- XP·레벨·미션·배지는 저장하지 않고 `Store.progress()` 가 기록에서 매번 다시 계산.
- 식당 기본 목록은 `REAL_RESTAURANTS`(data-real.js)이고, 없으면 `RESTAURANTS_BASE`(가상)를 씀. 모르는 정보(가격·주차 등)는 `null` = 화면에 "미확인". 가짜 후기·가짜 통계는 넣지 않음.
- 화면 render 함수가 함수를 return 하면 화면을 떠날 때 정리(cleanup)로 실행됨 — 지도처럼 window 이벤트를 다는 화면은 꼭 반환할 것.
- 지도는 외부 API가 아니라 직접 그린 SVG (`createMap` in ui.js, `proj()` 로 위경도→좌표). 화면에 가게가 많으면 핀 대신 점으로 그림.
- 식당 id 는 OSM 기반 고정값(`on123…`)이라 다시 수집해도 같은 가게의 후기·도장이 유지됨. id 규칙을 바꾸면 기존 기록이 끊김.
- `index.html` 의 `#app` 안 정적 내용(SEO 블록)은 검색엔진용이고, 앱이 시작되면 덮어씀. 정적 페이지(`r/`, `region/`)는 `index.html#/r/<id>` 로 앱에 연결.
- 지역 9개 (`대구·경북`, `부산·경남` 처럼 묶음). 지역 이름을 바꾸면 `REGION_LABELS`(ui.js), `REGION_SLUGS`(app.js), `REGION_SLUG`(build-seo.mjs), 미션 metric 을 같이 바꿔야 함.

## 데이터 갱신 (순서대로)
- `node tools/collect-osm.mjs` — OpenStreetMap Overpass 에서 감자탕 가게 수집 (키 불필요)
- `node tools/enrich-address.mjs` — 빈 주소를 Nominatim 으로 채움 (1초 1회, `tools/geocache.json` 캐시)
- `node tools/build-seo.mjs` — `r/`, `region/`, `faq.html`, `mbti.html`, sitemap.xml/txt, robots.txt, llms.txt, index.html 의 SEO 블록(`<!-- SEO:... -->`) 다시 생성
- 새 주소에는 "전남광주통합특별시" 같은 바뀐 시·도 이름이 섞여 있음. `regionFrom()` 접두어 목록을 확인할 것.

## SEO / 검색 등록
- robots.txt·llms.txt 는 도메인 맨 위에서만 읽힘. 실제로 쓰이는 파일은 `jinjin0009/jinjin0009.github.io` 저장소(`../github-root`)에 있음. llms.txt 를 새로 만들면 그쪽에도 복사.
- Google Search Console: URL 접두어 속성으로 등록됨. 확인 파일 `googlecc18b349ef71932c.html` 은 지우면 안 됨. 새 사이트라 사이트맵이 처음에 "가져올 수 없음"으로 뜸 (파일 자체는 정상).
- 네이버 서치어드바이저·네이버 지도 페이지는 두 브라우저 도구 모두 안전 제한으로 막힘 → 사용자가 직접 해야 함. 네이버 검색 API 수집기는 `tools/collect-naver.mjs` (키는 `tools/naver-key.json`, gitignore 됨).
- `build-seo.mjs` 는 생성 페이지의 "YYYY-MM-DD 기준" 날짜를 실행한 날로 바꿈 → 문구만 고칠 땐 생성 파일을 직접 고치거나 날짜 변경을 되돌릴 것.
- `og-image.png`(링크 공유 미리보기)에는 사이트 이름이 그림으로 박혀 있음 → 이름·문구를 바꾸면 `../promo-video` 에서 `node og-image.mjs ../gamjatang/og-image.png` 로 다시 만들기.

## 홍보영상
- `promo/` = 누구나 볼 수 있는 홍보영상 페이지 (https://jinjin0009.github.io/gamjatang/promo/). 영상 원본과 제작 도구는 저장소 밖 `../promo-video`.
- 제작 순서 (`../promo-video` 에서): `node capture.mjs`(사이트 화면 캡처, 로컬 서버 8090 필요) → `node music.mjs`(배경음악) → `node render.mjs`(mp4, `--stills 1,2.5` 는 정지 화면만) → `out/gamjatang-promo.mp4` 를 `promo/` 에 복사.
- 도구는 puppeteer-core + 설치된 Edge, ffmpeg-static. 다시 설치하면 `npm install-scripts approve ffmpeg-static; npm rebuild ffmpeg-static` 를 해야 ffmpeg.exe 가 받아짐.
- 로컬 serve.ps1 은 폴더 주소(`/promo/`)를 열지 못함 → `/promo/index.html` 로 확인.
- Claude 아티팩트는 "모든 사용자" 공개가 막혀 있음 → 누구나 볼 페이지는 이 저장소(GitHub Pages)에 올림.

## 실행·확인
- 빌드·린트·테스트 도구 없음. 수정 후 `node --check js/<파일>.js` 로 문법 확인 → 미리보기 브라우저에서 화면별로 열어 콘솔 오류 확인.
- 기록 관련 흐름은 브라우저 콘솔에서 `Store.signup({email, nick})`, `Store.addReview({...})`, `Store.progress(Store.me().id)` 로 바로 검증 가능. 확인 후 `Store.resetAll()` 로 테스트 데이터 정리.
- 로컬: `powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8090` (`.claude/launch.json` 의 `gamjatang`). `.ps1` 파일은 ASCII 로만 저장.
- git 은 `%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe` 전체 경로로 호출. push 는 SSH(ssh.github.com:443).
- GitHub 저장소 생성·설정은 내장 브라우저가 로그인돼 있지 않아서 Claude in Chrome 으로 진행.
- 이 PC 네트워크에서는 localdata.go.kr(403)과 서울 열린데이터 API(8088 포트)를 쓸 수 없음.
