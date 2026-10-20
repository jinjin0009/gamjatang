/* =========================================================
   주소가 비어 있거나 시·도가 빠진 가게의 주소를 좌표로 찾아 채움
   - OpenStreetMap Nominatim(역지오코딩) 사용, 키 필요 없음
   - 이용 규칙에 따라 1초에 1번만 요청하고, 결과는 tools/geocache.json 에 저장해 재사용
   실행: node tools/enrich-address.mjs   (collect-osm.mjs 다음에)
   ========================================================= */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "js", "data-real.js");
const cachePath = join(here, "geocache.json");
const src = readFileSync(file, "utf8");
const list = new Function(src + "; return REAL_RESTAURANTS;")();
const source = new Function(src + "; return REAL_SOURCE;")();
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROVINCE = [["서울", "서울"], ["인천", "인천"], ["경기", "경기"], ["강원", "강원"], ["대전", "충청"], ["세종", "충청"], ["충청", "충청"],
  ["대구", "대구·경북"], ["경상북", "대구·경북"], ["부산", "부산·경남"], ["울산", "부산·경남"], ["경상남", "부산·경남"],
  ["광주", "전라"], ["전라", "전라"], ["전북", "전라"], ["전남", "전라"], ["충북", "충청"], ["충남", "충청"], ["경북", "대구·경북"], ["경남", "부산·경남"], ["제주", "제주"]];
const regionFrom = (s) => { for (const [k, v] of PROVINCE) if (s && s.startsWith(k)) return v; return null; };

const need = list.filter((r) => !r.address || !regionFrom(r.address));
console.log(`주소 보완 대상 ${need.length}곳`);
let n = 0;
for (const r of need) {
  const ck = r.lat + "," + r.lng;
  let j = cache[ck];
  if (!j) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=ko&lat=${r.lat}&lon=${r.lng}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "gamjatang-gamboelsaya-prototype/0.1 (one-time address fill)" } });
      j = res.ok ? await res.json() : null;
    } catch { j = null; }
    if (j) cache[ck] = j;
    await sleep(1100);
  }
  n++;
  if (j && j.address) {
    const a = j.address;
    const prov = a.province || a.state || a.city && /특별시|광역시|특별자치/.test(a.city) && a.city || "";
    const city = a.city && a.city !== prov ? a.city : a.county || a.town || "";
    const gu = a.borough || a.city_district || a.suburb || "";
    const road = [a.road, a.house_number].filter(Boolean).join(" ");
    const full = [prov, city, gu, road || a.quarter || a.village || a.neighbourhood].filter(Boolean).join(" ");
    const reg = regionFrom(prov) || regionFrom(full);
    if (reg) r.region = reg;
    if (!r.address || !regionFrom(r.address)) r.address = full || r.address;
    if (!r.district) r.district = /광역시|특별시/.test(prov) ? gu : city || gu;
  }
  if (n % 20 === 0) { process.stdout.write(`\r${n}/${need.length}`); writeFileSync(cachePath, JSON.stringify(cache)); }
}
writeFileSync(cachePath, JSON.stringify(cache));
console.log("");

// 시·도가 들어 있는 주소는 그 기준으로 지역을 다시 맞추고, 비어 있는 구·시는 주소 두 번째 단어로 채움
list.forEach((r) => {
  const reg = regionFrom(r.address); if (reg) r.region = reg;
  if ((!r.district || /통합/.test(r.district)) && r.address) { const p = r.address.split(" "); r.district = /^(서울|부산|대구|인천|광주|대전|울산)(광역시|특별시)/.test(p[0]) ? `${p[0].replace(/광역시|특별시/, "")} ${p[1] || ""}`.trim() : p[1] || ""; }
});
list.sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
const out = src.replace(/const REAL_RESTAURANTS = [\s\S]*$/, `const REAL_RESTAURANTS = ${JSON.stringify(list).replace(/\},\{/g, "},\n{")};\n`);
writeFileSync(file, out, "utf8");
const by = {};
list.forEach((r) => (by[r.region] = (by[r.region] || 0) + 1));
console.log("완료", source.count, "곳", by, "주소 없음", list.filter((r) => !r.address).length);
