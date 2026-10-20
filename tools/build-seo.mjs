/* =========================================================
   검색엔진·AI 답변용 정적 페이지 생성 (SEO · AEO · GEO)
   - 사이트 본체는 #/주소로 화면을 바꾸는 방식이라, 검색엔진과 AI가 내용을 읽기 어려워요.
     그래서 식당·지역·FAQ·MBTI 페이지를 "그냥 읽히는 HTML"로 따로 만들어 둡니다.
   - 만드는 것: r/식당.html, region/지역.html, faq.html, mbti.html, sitemap.xml, robots.txt, llms.txt
   실행: node tools/build-seo.mjs   (식당 데이터가 바뀌면 다시 실행)
   ========================================================= */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SITE_URL = "https://jinjin0009.github.io/gamjatang/";
const today = new Date().toISOString().slice(0, 10);

/* 사이트 데이터 불러오기 (브라우저용 파일을 그대로 실행) */
const D = new Function(
  readFileSync(join(root, "js/data-real.js"), "utf8") + "\n" + readFileSync(join(root, "js/data.js"), "utf8") +
  "\nreturn { REAL_RESTAURANTS, REAL_SOURCE, MBTI_TYPES, MBTI_ORDER, WC_MENU, SCORE_ITEMS, REGIONS, SITE, MISSIONS };"
)();
const cleanName = (n) => n.replace(/^\s*(\(주\)|㈜|주식회사)\s*/, "");
const RS = D.REAL_RESTAURANTS.map((r) => ({ ...r, name: cleanName(r.name) }));

const REGION_SLUG = { 서울: "seoul", 경기: "gyeonggi", 인천: "incheon", 강원: "gangwon", 충청: "chungcheong", "대구·경북": "daegu-gyeongbuk", "부산·경남": "busan-gyeongnam", 전라: "jeolla", 제주: "jeju" };
const REGION_FULL = { 서울: "서울특별시", 경기: "경기도", 인천: "인천광역시", 강원: "강원특별자치도", 충청: "대전·세종·충청북도·충청남도", "대구·경북": "대구광역시·경상북도", "부산·경남": "부산·울산·경상남도", 전라: "광주·전라북도·전라남도", 제주: "제주특별자치도" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const abs = (p) => SITE_URL + p;
const byRegion = {};
D.REGIONS.forEach((g) => (byRegion[g] = RS.filter((r) => r.region === g)));

function distKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* 공통 틀: 제목·설명·대표주소(canonical)·SNS 미리보기·구조화 데이터 */
function page({ path, title, desc, depth, body, ld = [], type = "website" }) {
  const up = "../".repeat(depth);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="감자탕 감별사야">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs("og-image.png")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F5F0E6">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Black+Han+Sans&family=Space+Mono:wght@400;700&display=swap">
<link rel="stylesheet" href="${up}css/style.css">
<link rel="stylesheet" href="${up}css/static.css">
${ld.map(jsonld).join("\n")}
</head>
<body class="static">
<header id="gnb"><div class="wrap gnb">
  <a class="logo" href="${up}index.html"><span class="logo__mark">${BONE}</span><span class="logo__txt"><span class="logo__kr">감자탕 감별사야</span><span class="logo__en">BONE CLUB · FIND YOUR TANG.</span></span></a>
  <nav class="gnb__nav" aria-label="주요 메뉴"><a href="${up}index.html">HOME</a><a href="${up}index.html#/map">MAP</a><a href="${up}mbti.html">MBTI</a><a href="${up}index.html#/worldcup">WORLD CUP</a><a href="${up}faq.html">FAQ</a></nav>
  <div class="gnb__right"><a class="btn btn--sm btn--lime" href="${up}index.html#/map">지도 열기</a></div>
</div></header>
<main class="wrap static-main">
${body}
</main>
<footer id="footer"><div class="wrap footer">
  <div><div class="footer__big">FIND<br>YOUR TANG.</div><p class="mt small" style="opacity:.7">감자탕 감별사야 (BONE CLUB) — 전국 감자탕 맛집 지도 · 감자탕 MBTI · 감자탕 월드컵 · 도장깨기<br>가게 정보: © OpenStreetMap contributors (ODbL). 폐업·이전 등으로 실제와 다를 수 있어요. 평점은 감별사야 사용자 후기로만 계산해요.</p></div>
  <div><h4>지역별 감자탕</h4>${D.REGIONS.map((g) => `<a href="${up}region/${REGION_SLUG[g]}.html">${g} 감자탕 맛집</a>`).join("")}</div>
  <div><h4>알아보기</h4><a href="${up}faq.html">감자탕 FAQ</a><a href="${up}mbti.html">감자탕 MBTI 유형</a><a href="${up}index.html#/worldcup">감자탕 월드컵</a><a href="${up}index.html#/stamp">도장깨기</a></div>
</div></footer>
</body>
</html>
`;
}
const BONE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(-45 12 12)" fill="currentColor"><rect x="6" y="10" width="12" height="4" rx="1"/><circle cx="5.6" cy="9.7" r="2.7"/><circle cx="5.6" cy="14.3" r="2.7"/><circle cx="18.4" cy="9.7" r="2.7"/><circle cx="18.4" cy="14.3" r="2.7"/></g></svg>';

const crumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(p) })) });
const faqLd = (qa) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })) });
const faqHtml = (qa, h = "자주 묻는 질문") => `<section class="s-sec"><h2>${h}</h2>${qa.map(([q, a]) => `<details class="qa" open><summary>${esc(q)}</summary><p>${a}</p></details>`).join("")}</section>`;

/* ---------- 식당 페이지 ---------- */
rmSync(join(root, "r"), { recursive: true, force: true });
rmSync(join(root, "region"), { recursive: true, force: true });
mkdirSync(join(root, "r"), { recursive: true });
mkdirSync(join(root, "region"), { recursive: true });

const simpleHours = (h) => (h && /^[A-Za-z0-9 ,:;\-\/]+$/.test(h) ? h : null);
for (const r of RS) {
  const path = `r/${r.id}.html`;
  const gname = r.region, gslug = REGION_SLUG[gname];
  const near = RS.filter((x) => x.id !== r.id).map((x) => ({ x, d: distKm(r, x) })).sort((a, b) => a.d - b.d).slice(0, 6);
  const sameDistrict = RS.filter((x) => x.region === r.region && x.district === r.district).length;
  const naver = "https://map.naver.com/p/search/" + encodeURIComponent(r.name + " " + (r.address || ""));
  const title = `${r.name} — ${r.district || r.region} 감자탕 | 감자탕 감별사야`;
  const desc = `${r.name}: ${r.address || r.region} 감자탕집. 위치·지도·연락처 정보와 감자탕 감별사야 사용자 평점(국물·고기·볶음밥·가성비), 근처 감자탕 맛집을 확인하세요.`;
  const qa = [
    [`${r.name}은(는) 어디에 있나요?`, `${esc(r.address || r.region)}에 있어요. (위도 ${r.lat}, 경도 ${r.lng})`],
    [`${r.name} 영업시간은?`, r.hours ? `OpenStreetMap에 등록된 영업시간은 ${esc(r.hours)}예요. 방문 전 가게에 확인해 주세요.` : "아직 확인된 영업시간 정보가 없어요. 방문 전 가게에 직접 확인해 주세요."],
    [`${r.name} 근처 다른 감자탕집은?`, near.slice(0, 3).map(({ x, d }) => `${esc(x.name)}(약 ${d < 1 ? Math.round(d * 1000) + "m" : d.toFixed(1) + "km"})`).join(", ") + " 등이 가까워요."],
  ];
  const ld = [{
    "@context": "https://schema.org", "@type": "Restaurant", "@id": abs(path) + "#restaurant",
    name: r.name, url: abs(path), servesCuisine: ["감자탕", "Gamjatang (Korean pork bone soup)", "뼈해장국"],
    address: { "@type": "PostalAddress", streetAddress: r.address || undefined, addressLocality: r.district || undefined, addressRegion: REGION_FULL[gname], addressCountry: "KR" },
    geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng },
    hasMap: naver,
    ...(r.phone ? { telephone: r.phone } : {}),
    ...(simpleHours(r.hours) ? { openingHours: simpleHours(r.hours) } : {}),
    ...(r.osm ? { sameAs: [r.osm] } : {}),
  }, crumbLd([["홈", "index.html"], [`${gname} 감자탕`, `region/${gslug}.html`], [r.name, path]]), faqLd(qa)];
  const body = `
<nav class="crumb"><a href="../index.html">HOME</a> / <a href="../region/${gslug}.html">${esc(gname)} 감자탕</a> / <span>${esc(r.name)}</span></nav>
<article class="s-hero card">
  <div class="kicker">GAMJATANG · ${esc(gname)} · ${esc(r.district)}</div>
  <h1 class="s-title">${esc(r.name)}</h1>
  <p class="s-lead"><b>${esc(r.name)}</b>은(는) ${esc(r.address || gname)}에 있는 감자탕집이에요. 감자탕 감별사야에 등록된 ${esc(gname)} 감자탕집 ${byRegion[gname].length}곳 중 하나이고, 같은 ${esc(r.district || "지역")}에는 ${sameDistrict}곳이 있어요.</p>
  <div class="row gap fw mt">
    <a class="btn btn--lime btn--lg" href="../index.html#/r/${r.id}">평점 보기 · 후기 쓰고 XP 받기</a>
    <a class="btn btn--lg" href="${esc(naver)}" target="_blank" rel="noopener nofollow">네이버 지도에서 길찾기</a>
  </div>
</article>
<section class="s-sec"><h2>가게 정보</h2>
<table class="s-table">
  <tr><th>가게 이름</th><td>${esc(r.name)}</td></tr>
  <tr><th>주소</th><td>${esc(r.address || "미확인")}</td></tr>
  <tr><th>지역</th><td><a href="../region/${gslug}.html">${esc(gname)}</a> · ${esc(r.district || "-")}</td></tr>
  <tr><th>전화번호</th><td>${esc(r.phone || "미확인")}</td></tr>
  <tr><th>영업시간</th><td>${esc(r.hours || "미확인")}</td></tr>
  <tr><th>음식 종류</th><td>감자탕 · 뼈해장국</td></tr>
  <tr><th>사용자 평점</th><td>감자탕 감별사야 사용자 후기로 계산돼요. <a href="../index.html#/r/${r.id}">지금 평점 보기</a></td></tr>
  <tr><th>정보 출처</th><td>${r.osm ? `<a href="${esc(r.osm)}" rel="nofollow noopener" target="_blank">OpenStreetMap</a>` : "OpenStreetMap"} (© OpenStreetMap contributors, ODbL) · ${today} 기준</td></tr>
</table>
<p class="small muted mt-s">폐업·이전 등으로 실제와 다를 수 있어요. 방문 전 가게에 확인해 주세요.</p>
</section>
<section class="s-sec"><h2>${esc(r.name)} 근처 감자탕 맛집</h2>
<ul class="s-list">${near.map(({ x, d }) => `<li><a href="${x.id}.html">${esc(x.name)}</a> <span class="muted">${esc(x.district || x.region)} · 약 ${d < 1 ? Math.round(d * 1000) + "m" : d.toFixed(1) + "km"}</span></li>`).join("")}</ul>
</section>
${faqHtml(qa)}`;
  writeFileSync(join(root, path), page({ path, title, desc, depth: 1, body, ld, type: "restaurant" }), "utf8");
}

/* ---------- 지역 페이지 ---------- */
for (const g of D.REGIONS) {
  const list = byRegion[g];
  const slug = REGION_SLUG[g], path = `region/${slug}.html`;
  const groups = {};
  list.forEach((r) => (groups[r.district || "기타"] = groups[r.district || "기타"] || []).push(r));
  const top = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const title = `${g} 감자탕 맛집 ${list.length}곳 — 동네별 지도 | 감자탕 감별사야`;
  const desc = `${REGION_FULL[g]} 감자탕집 ${list.length}곳을 동네별로 모았어요. ${top.slice(0, 3).map(([d, a]) => `${d} ${a.length}곳`).join(", ")} 등. 국물·고기·볶음밥 사용자 평점과 도장깨기까지.`;
  const qa = [
    [`${g}에는 감자탕집이 몇 곳 있나요?`, `감자탕 감별사야에 등록된 ${g}(${REGION_FULL[g]}) 감자탕집은 ${list.length}곳이에요. (${today} 기준, OpenStreetMap 데이터)`],
    [`${g}에서 감자탕집이 가장 많은 동네는?`, top.slice(0, 3).map(([d, a]) => `${esc(d)}(${a.length}곳)`).join(", ") + " 순이에요."],
    [`${g} 감자탕 맛집 순위는 어떻게 정하나요?`, "광고나 외부 별점이 아니라, 감자탕 감별사야 사용자가 남긴 국물·고기·뼈·볶음밥·가성비 5개 항목 점수의 평균으로 정해요. 후기가 5개 미만인 가게는 '표본 적음'으로 표시해요."],
  ];
  const ld = [{
    "@context": "https://schema.org", "@type": "ItemList", name: `${g} 감자탕 맛집`, numberOfItems: list.length,
    itemListElement: list.slice(0, 100).map((r, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`r/${r.id}.html`), name: r.name })),
  }, crumbLd([["홈", "index.html"], [`${g} 감자탕`, path]]), faqLd(qa)];
  const body = `
<nav class="crumb"><a href="../index.html">HOME</a> / <span>${esc(g)} 감자탕</span></nav>
<article class="s-hero card">
  <div class="kicker">REGION · ${esc(REGION_FULL[g])}</div>
  <h1 class="s-title">${esc(g)} 감자탕 맛집 <span class="hl">${list.length}곳</span></h1>
  <p class="s-lead">${esc(REGION_FULL[g])}의 감자탕집 ${list.length}곳을 동네별로 모았어요. 가장 많은 곳은 ${top.slice(0, 3).map(([d, a]) => `${esc(d)}(${a.length}곳)`).join(", ")}예요.</p>
  <div class="row gap fw mt"><a class="btn btn--lime btn--lg" href="../index.html#/map?region=${encodeURIComponent(g)}">${esc(g)} 지도로 보기</a><a class="btn btn--lg" href="../index.html#/stamp">${esc(g)} 도장깨기</a></div>
</article>
<nav class="s-sec chips wrap-chips">${D.REGIONS.map((x) => `<a class="chip ${x === g ? "is-on" : ""}" href="${REGION_SLUG[x]}.html">${x} ${byRegion[x].length}</a>`).join("")}</nav>
${top.map(([d, a]) => `<section class="s-sec"><h2>${esc(d)} 감자탕 <span class="muted">${a.length}곳</span></h2><ul class="s-grid">${a.map((r) => `<li><a href="../r/${r.id}.html"><b>${esc(r.name)}</b><span>${esc(r.address || "")}</span></a></li>`).join("")}</ul></section>`).join("")}
${faqHtml(qa)}`;
  writeFileSync(join(root, path), page({ path, title, desc, depth: 1, body, ld }), "utf8");
}

/* ---------- FAQ (AEO: 질문-답 형식) ---------- */
const total = RS.length;
const regionCounts = D.REGIONS.map((g) => `${g} ${byRegion[g].length}곳`).join(", ");
const FAQ = [
  ["감자탕이 뭐예요?", "감자탕은 돼지 등뼈에 감자, 우거지(배추 시래기), 깻잎, 들깨가루 등을 넣고 얼큰하게 끓인 한국의 찌개·전골 요리예요. 냄비째 끓여 여럿이 나눠 먹고, 다 먹은 뒤 남은 국물에 밥을 볶아 먹는 '볶음밥'으로 마무리하는 경우가 많아요."],
  ["감자탕 이름에 왜 '감자'가 들어가요?", "재료로 들어가는 감자 때문이라는 설명이 가장 널리 알려져 있고, 돼지 등뼈 부위를 부르던 이름에서 왔다는 설도 있어요. 어원은 확실히 정리되지 않았어요."],
  ["감자탕과 뼈해장국은 뭐가 달라요?", "재료와 맛은 거의 같지만 먹는 방식이 달라요. 감자탕은 큰 냄비에 끓여 여럿이 나눠 먹는 전골이고, 뼈해장국은 뚝배기에 1인분씩 담아 내는 국밥 형태예요."],
  ["감자탕은 어떻게 먹으면 맛있어요?", "먼저 국물 맛을 보고, 뼈에 붙은 살을 젓가락으로 발라 먹은 뒤, 우거지와 감자를 곁들여요. 마지막에 남은 국물에 밥·김·김치를 넣어 볶음밥으로 마무리하면 '감자탕 풀코스'예요."],
  ["감자탕 감별사야는 어떤 사이트예요?", `전국 감자탕 맛집 지도, 감자탕 MBTI(취향 테스트), 감자탕 월드컵, 방문 도장깨기, 게임처럼 XP를 주는 후기 기능이 있는 감자탕 전문 플랫폼이에요. 현재 ${total}곳의 감자탕집이 등록돼 있어요.`],
  ["전국에 등록된 감자탕집은 몇 곳이에요?", `${today} 기준 ${total}곳이에요. 지역별로는 ${regionCounts}이에요.`],
  ["가게 정보는 어디서 가져와요?", "공개 지도 데이터인 OpenStreetMap(© OpenStreetMap contributors, ODbL)에서 가게 이름·주소·위치를 가져와요. 다른 플랫폼의 리뷰나 사진은 가져오지 않아요. 폐업·이전 등으로 실제와 다를 수 있어요."],
  ["평점은 어떻게 계산해요?", "감자탕 감별사야 사용자가 남긴 BROTH POWER(국물), MEAT DENSITY(고기 양), BONE VALUE(뼈 살코기), FRIED RICE ENDGAME(볶음밥), VALUE FOR MONEY(가성비) 5개 항목(각 1~5점)의 항목별 평균을 다시 평균 낸 값이에요. 후기가 5개 미만이면 '표본 적음'으로 표시해요."],
  ["감자탕 MBTI는 뭐예요?", `8개 질문으로 감자탕 취향을 6가지 유형(${D.MBTI_ORDER.map((k) => D.MBTI_TYPES[k].name).join(", ")})으로 알려주는 테스트예요. 결과에 맞는 맛집 정렬로 바로 연결돼요.`],
  ["감자탕 월드컵 결과는 믿을 수 있어요?", "사용자 투표 결과일 뿐 전문가 평가나 객관적 순위가 아니에요. 조작을 막기 위해 로그인한 사용자의 같은 월드컵은 하루 1번만 통계에 반영하고, 참여가 30회 미만이면 '초기 투표 결과'로 표시해요."],
  ["도장깨기는 어떻게 해요?", "가게 상세 화면에서 '방문 기록'을 남기면 기록 도장을, 영수증으로 인증을 요청해 관리자가 승인하면 인증 도장과 30 XP를 받아요. 도장을 모으면 지역 미션과 배지가 열려요."],
];
writeFileSync(join(root, "faq.html"), page({
  path: "faq.html", depth: 0,
  title: "감자탕 FAQ — 감자탕 뜻, 뼈해장국 차이, 맛있게 먹는 법 | 감자탕 감별사야",
  desc: "감자탕이 뭔지, 뼈해장국과 차이, 맛있게 먹는 법, 전국 감자탕집 수와 평점 계산 방식까지. 감자탕에 대해 자주 묻는 질문을 한곳에 정리했어요.",
  ld: [faqLd(FAQ), crumbLd([["홈", "index.html"], ["감자탕 FAQ", "faq.html"]])],
  body: `<nav class="crumb"><a href="index.html">HOME</a> / <span>FAQ</span></nav>
<article class="s-hero card"><div class="kicker">GAMJATANG FAQ</div><h1 class="s-title">감자탕, <span class="hl">무엇이든</span> 물어보세요</h1>
<p class="s-lead">감자탕은 돼지 등뼈와 감자, 우거지를 넣고 얼큰하게 끓인 한국 요리예요. 감자탕 감별사야는 전국 감자탕집 ${total}곳의 지도와 사용자 평점을 모은 감자탕 전문 사이트예요.</p></article>
${faqHtml(FAQ, "감자탕 자주 묻는 질문")}
<section class="s-sec"><h2>지역별 감자탕 맛집</h2><ul class="s-grid">${D.REGIONS.map((g) => `<li><a href="region/${REGION_SLUG[g]}.html"><b>${g} 감자탕 맛집</b><span>${byRegion[g].length}곳</span></a></li>`).join("")}</ul></section>`,
}), "utf8");

/* ---------- 감자탕 MBTI 유형 ---------- */
const mbtiQa = D.MBTI_ORDER.map((k) => { const t = D.MBTI_TYPES[k]; return [`${t.name}(${t.kr})는 어떤 유형인가요?`, `${t.one}이에요. ${t.desc} 좋아하는 것: ${t.likes.join(", ")}.`]; });
writeFileSync(join(root, "mbti.html"), page({
  path: "mbti.html", depth: 0,
  title: "감자탕 MBTI 6가지 유형 — 국물파? 뼈파? 볶음밥파? | 감자탕 감별사야",
  desc: `감자탕 MBTI 유형 6가지: ${D.MBTI_ORDER.map((k) => `${D.MBTI_TYPES[k].name}(${D.MBTI_TYPES[k].kr})`).join(", ")}. 8문항 테스트로 내 감자탕 취향을 찾아보세요.`,
  ld: [faqLd(mbtiQa), crumbLd([["홈", "index.html"], ["감자탕 MBTI", "mbti.html"]]),
    { "@context": "https://schema.org", "@type": "Quiz", name: "감자탕 MBTI", about: "감자탕 취향 유형 테스트", educationalLevel: "beginner", url: abs("index.html#/mbti") }],
  body: `<nav class="crumb"><a href="index.html">HOME</a> / <span>감자탕 MBTI</span></nav>
<article class="s-hero card"><div class="kicker">TANG MBTI</div><h1 class="s-title">감자탕 MBTI <span class="hl">6가지 유형</span></h1>
<p class="s-lead">8개 질문에 답하면 국물·고기·볶음밥·노포·가성비·탐험 중 내 감자탕 취향을 알려줘요. 결과에 맞는 맛집 정렬로 바로 이어져요.</p>
<div class="row gap fw mt"><a class="btn btn--lime btn--lg" href="index.html#/mbti/test">테스트 시작하기</a></div></article>
<section class="s-sec"><ul class="s-types">${D.MBTI_ORDER.map((k) => { const t = D.MBTI_TYPES[k]; return `<li id="${k.toLowerCase()}" style="background:${t.color};color:${t.ink}"><h2>${t.name}</h2><p class="kr">${t.kr} — ${t.one}</p><p>${t.desc}</p><p><b>좋아하는 것:</b> ${t.likes.join(" · ")}</p><a class="btn btn--sm" href="index.html#/mbti/result/${k}">이 유형 자세히</a></li>`; }).join("")}</ul></section>
${faqHtml(mbtiQa, "유형별 설명")}`,
}), "utf8");

/* ---------- sitemap · robots · llms.txt ---------- */
const urls = [["", "1.0", "daily"], ["faq.html", "0.8", "monthly"], ["mbti.html", "0.7", "monthly"]]
  .concat(D.REGIONS.map((g) => [`region/${REGION_SLUG[g]}.html`, "0.8", "weekly"]))
  .concat(RS.map((r) => [`r/${r.id}.html`, "0.6", "monthly"]));
writeFileSync(join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, pr, cf]) => `  <url><loc>${abs(p)}</loc><lastmod>${today}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`, "utf8");

writeFileSync(join(root, "robots.txt"), `# 감자탕 감별사야 — 검색엔진과 AI 답변 엔진 모두 환영해요
User-agent: *
Allow: /

# AI 검색·답변 서비스 (GEO)
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Yeti
Allow: /

Sitemap: ${abs("sitemap.xml")}
`, "utf8");

writeFileSync(join(root, "llms.txt"), `# 감자탕 감별사야 (BONE CLUB)

> 전국 감자탕 맛집 지도와 사용자 평점, 감자탕 MBTI(취향 테스트), 감자탕 월드컵, 방문 도장깨기를 제공하는 한국어 감자탕 전문 사이트. ${today} 기준 감자탕집 ${total}곳 등록.

- 가게 정보 출처: OpenStreetMap (© OpenStreetMap contributors, ODbL). 다른 플랫폼의 리뷰·사진은 쓰지 않음.
- 평점: 사이트 사용자가 국물·고기 양·뼈 살코기·볶음밥·가성비 5개 항목(1~5점)으로 매긴 점수의 평균. 후기 5개 미만은 '표본 적음'.
- 월드컵 결과는 사용자 투표이며 전문가 평가가 아님.
- 지역별 가게 수: ${regionCounts}.

## 핵심 페이지
- [감자탕 FAQ](${abs("faq.html")}): 감자탕 뜻, 뼈해장국과 차이, 먹는 법, 평점 계산 방식
- [감자탕 MBTI 6가지 유형](${abs("mbti.html")}): ${D.MBTI_ORDER.map((k) => D.MBTI_TYPES[k].name).join(", ")}
- [감자탕 맛집 지도](${abs("index.html#/map")}): 지역·이름·메뉴 검색, 평점·후기순 정렬

## 지역별 감자탕 맛집
${D.REGIONS.map((g) => `- [${g} 감자탕 맛집 ${byRegion[g].length}곳](${abs(`region/${REGION_SLUG[g]}.html`)})`).join("\n")}

## 전체 가게 목록
- [sitemap.xml](${abs("sitemap.xml")}) 에 가게별 페이지(r/*.html)가 모두 있어요. 각 페이지에 주소·좌표·근처 감자탕집·구조화 데이터(schema.org Restaurant)가 있어요.
`, "utf8");

/* ---------- index.html: 구조화 데이터 + 자바스크립트 없이도 읽히는 기본 내용 ---------- */
const homeLd = [
  { "@context": "https://schema.org", "@type": "WebSite", "@id": abs("#website"), name: "감자탕 감별사야", alternateName: ["BONE CLUB", "감별사야"], url: SITE_URL, inLanguage: "ko-KR",
    description: `전국 감자탕집 ${total}곳의 지도와 사용자 평점, 감자탕 MBTI, 감자탕 월드컵, 도장깨기를 제공하는 감자탕 전문 사이트` },
  { "@context": "https://schema.org", "@type": "Organization", "@id": abs("#org"), name: "감자탕 감별사야 (BONE CLUB)", url: SITE_URL, logo: abs("favicon.svg"), slogan: "FIND YOUR TANG." },
  { "@context": "https://schema.org", "@type": "ItemList", name: "지역별 감자탕 맛집", itemListElement: D.REGIONS.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: `${g} 감자탕 맛집 ${byRegion[g].length}곳`, url: abs(`region/${REGION_SLUG[g]}.html`) })) },
  faqLd(FAQ.slice(0, 4)),
];
const homeBody = `<div class="wrap static-main">
    <section class="s-hero card"><div class="kicker">FIND YOUR TANG.</div>
      <h1 class="s-title">감자탕 감별사야 — 전국 감자탕 맛집 지도</h1>
      <p class="s-lead">전국 감자탕집 <b>${total}곳</b>을 지도로 찾고, 국물·고기 양·뼈 살코기·볶음밥·가성비 5개 항목 점수로 감별하는 감자탕 전문 사이트예요. 감자탕 MBTI로 내 취향을 찾고, 감자탕 월드컵과 방문 도장깨기로 게임처럼 즐겨 보세요.</p>
      <p class="mt"><a class="btn btn--lime" href="#/map">감자탕 맛집 지도</a> <a class="btn" href="mbti.html">감자탕 MBTI</a> <a class="btn" href="faq.html">감자탕 FAQ</a></p></section>
    <section class="s-sec"><h2>지역별 감자탕 맛집</h2><ul class="s-grid">${D.REGIONS.map((g) => `<li><a href="region/${REGION_SLUG[g]}.html"><b>${g} 감자탕 맛집</b><span>${byRegion[g].length}곳</span></a></li>`).join("")}</ul></section>
    ${faqHtml(FAQ.slice(0, 4), "감자탕 한눈에 보기")}
  </div>`;
let idx = readFileSync(join(root, "index.html"), "utf8");
idx = idx.replace(/<!-- SEO:LD:START -->[\s\S]*?<!-- SEO:LD:END -->/, `<!-- SEO:LD:START -->\n  ${homeLd.map(jsonld).join("\n  ")}\n  <!-- SEO:LD:END -->`)
  .replace(/<!-- SEO:BODY:START -->[\s\S]*?<!-- SEO:BODY:END -->/, `<!-- SEO:BODY:START -->\n  ${homeBody}\n  <!-- SEO:BODY:END -->`);
writeFileSync(join(root, "index.html"), idx, "utf8");

console.log(`완료: 식당 ${RS.length} · 지역 ${D.REGIONS.length} · FAQ · MBTI · sitemap(${urls.length} URL) · robots · llms.txt`);
