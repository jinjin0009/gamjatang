/* =========================================================
   공공데이터포털 "소상공인시장진흥공단_상가(상권)정보" 에서 전국 감자탕 가게를 골라
   기존 OpenStreetMap 목록(js/data-real.js)과 합침 — 무료, 이용허락범위 제한 없음
   - 받는 곳: https://www.data.go.kr/data/15083033/fileData.do (분기마다 갱신)
   - zip 을 tools/sbiz/ 에 풀어 두면 그 안의 CSV(지역별)를 모두 읽음 (tools/sbiz/ 는 git 에 안 올림)
   - 같은 가게(가까운 위치 + 비슷한 이름)는 기존 OSM id 를 그대로 둬서 후기·도장이 끊기지 않음
   - 새 가게 id 는 "s" + 상가업소번호 (분기마다 다시 받아도 같은 가게는 같은 id)

   실행: node tools/collect-sbiz.mjs           → js/data-real.js 갱신
         node tools/collect-sbiz.mjs --dry     → 파일은 안 바꾸고 숫자만 보기
   그다음: node tools/build-seo.mjs
   ========================================================= */
import { readFileSync, writeFileSync, readdirSync, statSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const DRY = process.argv.includes("--dry");

// 상호에 이 말이 들어간 음식점만 (감자탕도 파는 고깃집·분식집은 빠짐)
const NAME_RE = /감자탕|뼈해장국|감자국|뼈다귀/;
// 이름에 들어가도 감자탕집이 아닌 곳
const EXCLUDE_RE = /식자재|도매|유통|푸드시스템|본사|물류|가맹/;

const PROVINCE = [["서울", "서울"], ["인천", "인천"], ["경기", "경기"], ["강원", "강원"], ["대전", "충청"], ["세종", "충청"], ["충청", "충청"], ["충북", "충청"], ["충남", "충청"],
  ["대구", "대구·경북"], ["경상북", "대구·경북"], ["경북", "대구·경북"], ["부산", "부산·경남"], ["울산", "부산·경남"], ["경상남", "부산·경남"], ["경남", "부산·경남"],
  ["광주", "전라"], ["전라", "전라"], ["전북", "전라"], ["전남", "전라"], ["제주", "제주"]];
const regionFrom = (s) => { for (const [k, v] of PROVINCE) if (s && s.startsWith(k)) return v; return null; };

/* CSV 한 줄 → 칸 배열 (따옴표 안의 쉼표 처리) */
function parseLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function csvFiles(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...csvFiles(p));
    else if (/\.csv$/i.test(n)) out.push(p);
  }
  return out;
}

async function readSbiz() {
  const files = csvFiles(join(here, "sbiz"));
  if (!files.length) throw new Error("tools/sbiz/ 에 상가정보 CSV 가 없어요. zip 을 받아서 풀어 주세요.");
  const rows = []; let total = 0; let dataDate = "";
  for (const f of files) {
    const m = f.match(/_(\d{6})\.csv$/); if (m) dataDate = m[1];
    const rl = createInterface({ input: createReadStream(f, "utf8"), crlfDelay: Infinity });
    let head = null;
    for await (let line of rl) {
      if (!head) { head = parseLine(line.replace(/^﻿/, "")); continue; }
      total++;
      if (!NAME_RE.test(line)) continue; // 빠르게 거르기
      const c = parseLine(line), g = (k) => c[head.indexOf(k)] || "";
      const name = g("상호명").trim();
      if (!NAME_RE.test(name) || EXCLUDE_RE.test(name)) continue;
      if (g("상권업종대분류명") !== "음식") continue;
      rows.push({
        no: g("상가업소번호"), name, branch: g("지점명").trim(), cat: g("상권업종소분류명"),
        sido: g("시도명"), sigungu: g("시군구명"), road: g("도로명주소"), jibun: g("지번주소"),
        bldg: g("건물명"), floor: g("층정보"), lat: +g("위도"), lng: +g("경도"),
      });
    }
  }
  return { rows, total, dataDate };
}

/* 이름 비교용: 괄호·법인 표기·공백·흔한 꼬리말 제거 */
const norm = (s) => s.normalize("NFKC").replace(/\(주\)|㈜|주식회사/g, "").replace(/\([^)]*\)/g, "").replace(/[\s·&.,;:'"\-_/]/g, "").replace(/(본점|직영점|\d*호점)$/, "").toLowerCase();
const core = (s) => norm(s).replace(/감자탕|뼈해장국|해장국|감자국|뼈다귀|뼈찜|전문점?|식당|원조|24시간?/g, "");
const bigrams = (s) => { const out = new Set(); for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2)); return out; };
function dice(a, b) { const A = bigrams(a), B = bigrams(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return (2 * n) / (A.size + B.size); }
function sameName(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ca = core(a), cb = core(b);
  if (ca.length >= 2 && cb.length >= 2 && (ca.includes(cb) || cb.includes(ca))) return true;
  return dice(na, nb) >= 0.6; // 뚱땡이감자탕 ↔ 뚱뎅이감자탕 같은 오타
}
// 같은 가게로 볼지: 20m 안이면 이름이 달라도(간판이 바뀐 경우), 150m 안이면 이름이 비슷할 때
const isSame = (o, s, d) => d <= 20 || (d <= 150 && sameName(o.name, s.name));
function distM(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* 시군구명 → 사이트의 district (예: "성남시 분당구", "강동구") */
function districtOf(sido, sigungu) {
  if (!sigungu) return "";
  if (/세종/.test(sido)) return "세종시";
  return sigungu.trim();
}
function addressOf(r) {
  // 도로명주소의 "세종특별자치시 세종특별자치시" 같은 중복 제거, 층 정보 덧붙임
  const a = (r.road || r.jibun).replace(/^(\S+) \1 /, "$1 ");
  const fl = r.floor && /^\d+$/.test(r.floor) ? ` ${r.floor}층` : r.floor && /^B\d+$/i.test(r.floor) ? ` 지하 ${r.floor.slice(1)}층` : "";
  return a + fl;
}

const { rows, total, dataDate } = await readSbiz();
console.log(`상가 ${total.toLocaleString()}곳 중 감자탕 이름 음식점 ${rows.length}곳`);
const cats = {}; rows.forEach((r) => (cats[r.cat] = (cats[r.cat] || 0) + 1));
console.log("업종 소분류:", Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 12));

// 상가정보 안의 중복(같은 업소번호) 제거
const sb = [...new Map(rows.filter((r) => r.lat && r.lng && r.no).map((r) => [r.no, r])).values()];

// 기존 OSM 목록: data-real.js 가 막 collect-osm/enrich-address 로 만든 것이면 그걸 원본으로 저장해 두고,
// 이미 합친 파일이면 저장해 둔 원본(tools/osm-base.json)을 씀 → 몇 번을 다시 돌려도 결과가 같음
const realPath = join(root, "js", "data-real.js");
const basePath = join(here, "osm-base.json");
const src = readFileSync(realPath, "utf8");
const srcInfo = new Function(src + "; return REAL_SOURCE;")();
let osm;
if (srcInfo.name === "OpenStreetMap") {
  osm = new Function(src + "; return REAL_RESTAURANTS;")();
  if (!DRY) writeFileSync(basePath, JSON.stringify(osm), "utf8");
} else {
  osm = JSON.parse(readFileSync(basePath, "utf8"));
}

// 같은 가게 찾기: 가까운 쌍부터 차례로 짝지음 (한 가게는 한 번만)
const pairs = [];
for (const o of osm) for (const s of sb) {
  if (Math.abs(o.lat - s.lat) > 0.002 || Math.abs(o.lng - s.lng) > 0.0025) continue;
  const d = distM(o, s);
  if (isSame(o, s, d)) pairs.push([d, o, s]);
}
pairs.sort((a, b) => a[0] - b[0]);
const pairOf = new Map(), usedOsm = new Set();
for (const [, o, s] of pairs) if (!usedOsm.has(o.id) && !pairOf.has(s.no)) { usedOsm.add(o.id); pairOf.set(s.no, o); }
// OSM 안에서 같은 가게가 두 번 올라온 경우(이미 짝지어진 가게와 300m 안 + 같은 이름)는 뺌
const merged = [];
let matched = 0;
for (const s of sb) {
  const best = pairOf.get(s.no) || null;
  const sido = s.sido;
  const base = {
    // 지점명을 붙여 같은 이름 가게를 구분 (전각 숫자 "２４시" → "24시")
    name: (s.branch && !s.name.includes(s.branch) ? `${s.name} ${s.branch}` : s.name).normalize("NFKC"),
    region: regionFrom(sido) || regionFrom(s.road) || "전라",
    district: districtOf(sido, s.sigungu),
    address: addressOf(s),
    lat: +s.lat.toFixed(6), lng: +s.lng.toFixed(6),
    sbiz: s.no,
  };
  if (best) {
    matched++;
    // id·전화·영업시간·홈페이지·OSM 링크는 OSM 것을 유지, 이름·주소·위치는 상가정보(더 최신·정확)로
    merged.push({ id: best.id, ...base, phone: best.phone, hours: best.hours, homepage: best.homepage, osm: best.osm });
  } else {
    const { sbiz, ...rest } = base; // id 에 업소번호가 이미 들어 있음
    merged.push({ id: "s" + sbiz, ...rest });
  }
}
// 상가정보에 없는 OSM 가게도 그대로 둠 (상가정보에서 빠진 가게일 수 있음)
const dupOsm = osm.filter((o) => !usedOsm.has(o.id) && sb.some((s) => Math.abs(o.lat - s.lat) < 0.004 && Math.abs(o.lng - s.lng) < 0.005 && distM(o, s) <= 300 && sameName(o.name, s.name)));
const osmOnly = osm.filter((o) => !usedOsm.has(o.id) && !dupOsm.includes(o));
for (const o of osmOnly) merged.push(o);
console.log(`OSM 중복으로 뺀 가게 ${dupOsm.length}곳:`, dupOsm.map((o) => o.name).join(", "));
if (process.argv.includes("--report")) {
  // 이름이 달라서 못 합친 가까운 쌍 (같은 가게인데 놓친 건지 눈으로 확인용)
  for (const o of osmOnly) {
    const near = sb.map((s) => [s, distM(o, s)]).filter(([, d]) => d < 60).sort((a, b) => a[1] - b[1])[0];
    console.log(near ? `가까움 ${Math.round(near[1])}m  OSM "${o.name}"  ↔  상가 "${near[0].name}"` : `없음  OSM "${o.name}" ${o.address || ""}`);
  }
}

// 빈 값(null) 칸은 빼서 파일 크기 줄이기
const list = merged.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null && v !== undefined && v !== "")));
list.sort((a, b) => a.region.localeCompare(b.region) || (a.district || "").localeCompare(b.district || "") || a.name.localeCompare(b.name));

const by = {}; list.forEach((r) => (by[r.region] = (by[r.region] || 0) + 1));
console.log(`합친 결과 ${list.length}곳 (상가정보 ${sb.length} · 그중 OSM 과 같은 가게 ${matched} · OSM 에만 있는 가게 ${osmOnly.length})`, by);
if (DRY) process.exit(0);

const today = new Date().toISOString().slice(0, 10);
const asOf = dataDate ? `${dataDate.slice(0, 4)}-${dataDate.slice(4, 6)}` : "";
writeFileSync(realPath, `/* 자동 생성 파일 — tools/collect-osm.mjs(+enrich-address.mjs) 다음 tools/collect-sbiz.mjs 로 만들었어요.
   출처: 소상공인시장진흥공단 상가(상권)정보(공공데이터포털, ${asOf} 기준) + © OpenStreetMap contributors (ODbL) · 합친 날 ${today} · ${list.length}곳 */
const REAL_SOURCE = { name: "소상공인시장진흥공단 상가(상권)정보 · OpenStreetMap", license: "공공데이터포털(이용허락범위 제한 없음) · © OpenStreetMap contributors (ODbL)", collectedAt: "${today}", dataAsOf: "${asOf}", count: ${list.length} };
const REAL_RESTAURANTS = ${JSON.stringify(list).replace(/\},\{/g, "},\n{")};
`, "utf8");
console.log("js/data-real.js 저장 완료");
