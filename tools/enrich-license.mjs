/* =========================================================
   행정안전부 "식품_일반음식점 조회서비스"(공공데이터포털, 무료·자동승인)로 가게 정보 채우기
   - 채우는 것: 전화번호, 인허가일자(→ 개업 연도·노포·신규), 홈페이지, 폐업 여부
   - API: https://www.data.go.kr/data/15154916/openapi.do  (하루 10,000번까지 무료)
   - 인증키: 공공데이터포털 마이페이지의 "일반 인증키(Decoding)" 를 tools/datago-key.txt 에 한 줄로 저장 (git 에 안 올림)
   - 받은 자료는 tools/license-cache.json 에 저장해 두고 다시 쓰기 (git 에 안 올림)

   실행: node tools/enrich-license.mjs            (collect-sbiz.mjs 다음, build-seo.mjs 전에)
         node tools/enrich-license.mjs --refresh  (자료를 새로 받기)
   ========================================================= */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const realPath = join(root, "js", "data-real.js");
const cachePath = join(here, "license-cache.json");
const KEYWORDS = ["감자탕", "뼈해장국", "감자국", "뼈다귀"];
const API = "https://apis.data.go.kr/1741000/general_restaurants/info";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 1. 인허가 자료 받기 ---------- */
async function fetchAll() {
  const keyPath = join(here, "datago-key.txt");
  if (!existsSync(keyPath)) throw new Error("tools/datago-key.txt 에 공공데이터포털 인증키를 넣어 주세요.");
  const key = readFileSync(keyPath, "utf8").trim();
  const byNo = new Map();
  for (const kw of KEYWORDS) {
    for (let page = 1; ; page++) {
      const q = new URLSearchParams({ serviceKey: key, pageNo: String(page), numOfRows: "100", returnType: "json", "cond[BPLC_NM::LIKE]": kw });
      let j = null;
      for (let t = 0; t < 4 && !j; t++) {
        try {
          const res = await fetch(`${API}?${q}`);
          const txt = await res.text();
          j = JSON.parse(txt);
        } catch (e) { await sleep(1500 * (t + 1)); }
      }
      if (!j) throw new Error(`${kw} ${page}쪽을 받지 못했어요`);
      const body = j.response?.body;
      if (!body) throw new Error("응답이 이상해요: " + JSON.stringify(j).slice(0, 300));
      let items = body.items?.item || [];
      if (!Array.isArray(items)) items = [items];
      items.forEach((it) => byNo.set(it.OPN_ATMY_GRP_CD + "-" + it.MNG_NO, it));
      process.stdout.write(`\r${kw} ${page}쪽 · 누적 ${byNo.size}곳   `);
      if (page * 100 >= (body.totalCount || 0) || !items.length) break;
      await sleep(150);
    }
  }
  console.log("");
  const keep = ["BPLC_NM", "ROAD_NM_ADDR", "LOTNO_ADDR", "TELNO", "LCPMT_YMD", "CLSBIZ_YMD", "SALS_STTS_NM", "DTL_SALS_STTS_NM", "HPG", "CRD_INFO_X", "CRD_INFO_Y", "SNTTN_BZSTAT_NM"];
  return [...byNo.values()].map((it) => Object.fromEntries(keep.map((k) => [k, it[k] ?? ""])));
}

/* ---------- 2. 좌표 바꾸기: EPSG:5174(Bessel 중부원점 TM) → WGS84 위경도 ---------- */
const BES = { a: 6377397.155, f: 1 / 299.1528128 }, WGS = { a: 6378137, f: 1 / 298.257223563 };
const D2R = Math.PI / 180;
function tmInverse(x, y) {
  const { a, f } = BES, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 1, lat0 = 38 * D2R, lon0 = 127.0028902777778 * D2R, x0 = 200000, y0 = 500000;
  const Mf = (p) => a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p) + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const M = Mf(lat0) + (y - y0) / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const C1 = ep2 * Math.cos(p1) ** 2, T1 = Math.tan(p1) ** 2, N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(p1) ** 2) ** 1.5, D = (x - x0) / (N1 * k0);
  const lat = p1 - ((N1 * Math.tan(p1)) / R1) * (D ** 2 / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6) / 720);
  const lon = lon0 + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5) / 120) / Math.cos(p1);
  return [lat, lon];
}
function toEcef(lat, lon, { a, f }) { const e2 = f * (2 - f), N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2); return [N * Math.cos(lat) * Math.cos(lon), N * Math.cos(lat) * Math.sin(lon), N * (1 - e2) * Math.sin(lat)]; }
function fromEcef([X, Y, Z], { a, f }) {
  const e2 = f * (2 - f), p = Math.hypot(X, Y), lon = Math.atan2(Y, X);
  let lat = Math.atan2(Z, p * (1 - e2));
  for (let i = 0; i < 6; i++) { const N = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2); lat = Math.atan2(Z + e2 * N * Math.sin(lat), p); }
  return [lat, lon];
}
function to4326(x, y) {
  if (!x || !y) return null;
  const [lat, lon] = tmInverse(+x, +y);
  const [X, Y, Z] = toEcef(lat, lon, BES);
  const tx = -115.8, ty = 474.99, tz = 674.11, as = Math.PI / 648000, rx = 1.16 * as, ry = -2.31 * as, rz = -1.63 * as, s = 6.43e-6;
  const P = [tx + (1 + s) * (X - rz * Y + ry * Z), ty + (1 + s) * (rz * X + Y - rx * Z), tz + (1 + s) * (-ry * X + rx * Y + Z)];
  const [la, lo] = fromEcef(P, WGS);
  return { lat: la / D2R, lng: lo / D2R };
}

/* ---------- 3. 같은 가게 찾기 ---------- */
const norm = (s) => String(s || "").normalize("NFKC").replace(/\(주\)|㈜|주식회사/g, "").replace(/\([^)]*\)/g, "").replace(/[\s·&.,;:'"\-_/]/g, "").toLowerCase();
const core = (s) => norm(s).replace(/감자탕|뼈해장국|해장국|감자국|뼈다귀|뼈찜|전문점?|식당|원조|24시간?|본점|\S*점$/g, "");
function sameName(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const ca = core(a), cb = core(b);
  return ca.length >= 2 && cb.length >= 2 && (ca.includes(cb) || cb.includes(ca));
}
// 도로명주소의 "○○로 123" 부분 (건물 단위로 비교)
const roadKey = (s) => { const m = String(s || "").replace(/\([^)]*\)/g, "").match(/([가-힣0-9]+(?:로|길))\s*(\d+(?:-\d+)?)/); return m ? m[1] + " " + m[2] : ""; };
function distM(a, b) {
  const R = 6371000, dLat = (b.lat - a.lat) * D2R, dLng = (b.lng - a.lng) * D2R;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const fmtTel = (t) => {
  const d = String(t || "").replace(/\D/g, "");
  if (d.length < 8 || /^0+$/.test(d)) return null;
  if (d.startsWith("02")) return d.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
  return d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3").replace(/^(\d{4})(\d{4})$/, "$1-$2");
};

/* ---------- 실행 ---------- */
let lic;
if (existsSync(cachePath) && !process.argv.includes("--refresh")) lic = JSON.parse(readFileSync(cachePath, "utf8"));
else { lic = await fetchAll(); writeFileSync(cachePath, JSON.stringify(lic), "utf8"); }
console.log(`인허가 자료 ${lic.length}곳 (영업 ${lic.filter((x) => x.SALS_STTS_NM === "영업/정상").length})`);
lic.forEach((x) => { x.pos = to4326(x.CRD_INFO_X, x.CRD_INFO_Y); x.rk = roadKey(x.ROAD_NM_ADDR); });

const src = readFileSync(realPath, "utf8");
const list = new Function(src + "; return REAL_RESTAURANTS;")();
const byRoad = new Map();
lic.forEach((x) => { if (x.rk) (byRoad.get(x.rk) || byRoad.set(x.rk, []).get(x.rk)).push(x); });

let filled = 0, phones = 0, closed = 0;
const geoErr = [];
const out = [];
for (const r of list) {
  // 후보: 같은 건물 주소 + 비슷한 이름, 없으면 150m 안 + 비슷한 이름
  let cands = (byRoad.get(roadKey(r.address)) || []).filter((x) => sameName(x.BPLC_NM, r.name));
  if (!cands.length) cands = lic.filter((x) => x.pos && Math.abs(x.pos.lat - r.lat) < 0.002 && Math.abs(x.pos.lng - r.lng) < 0.0025 && distM(x.pos, r) <= 150 && sameName(x.BPLC_NM, r.name));
  if (!cands.length) { out.push(r); continue; }
  const open = cands.filter((x) => x.SALS_STTS_NM === "영업/정상").sort((a, b) => b.LCPMT_YMD.localeCompare(a.LCPMT_YMD));
  if (!open.length) {
    // 영업 중인 인허가가 하나도 없고 모두 폐업 → OSM 에만 있던 가게면 뺌, 상가정보 가게는 '폐업 가능성' 표시
    if (!/^s/.test(r.id) && !r.sbiz) { closed++; continue; }
    out.push({ ...r, maybeClosed: true }); continue;
  }
  const x = open[0];
  if (x.pos) geoErr.push(distM(x.pos, r));
  const tel = fmtTel(x.TELNO);
  const since = /^\d{8}$/.test(x.LCPMT_YMD) ? x.LCPMT_YMD.slice(0, 4) + "-" + x.LCPMT_YMD.slice(4, 6) : null;
  const n = { ...r };
  if (!n.phone && tel) { n.phone = tel; phones++; }
  if (since) n.since = since;
  if (!n.homepage && /^https?:\/\//i.test(x.HPG || "")) n.homepage = x.HPG.trim();
  out.push(n); filled++;
}
geoErr.sort((a, b) => a - b);
console.log(`맞춘 가게 ${filled}/${list.length} · 전화번호 새로 채움 ${phones} · 폐업으로 뺀 가게 ${closed} · 폐업 가능성 ${out.filter((r) => r.maybeClosed).length}`);
if (geoErr.length) console.log(`좌표 차이(같은 가게): 중간값 ${Math.round(geoErr[geoErr.length >> 1])}m, 90% ${Math.round(geoErr[Math.floor(geoErr.length * 0.9)])}m`);
if (process.argv.includes("--dry")) process.exit(0);

const info = new Function(src + "; return REAL_SOURCE;")();
info.license2 = "행정안전부 식품_일반음식점 인허가 정보(공공데이터포털, 이용허락범위 제한 없음)";
info.licenseAsOf = new Date().toISOString().slice(0, 10);
info.count = out.length;
const head = src.slice(0, src.indexOf("const REAL_SOURCE"));
writeFileSync(realPath, `${head}const REAL_SOURCE = ${JSON.stringify(info)};
const REAL_RESTAURANTS = ${JSON.stringify(out).replace(/\},\{/g, "},\n{")};
`, "utf8");
console.log("js/data-real.js 저장 완료");
