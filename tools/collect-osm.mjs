/* =========================================================
   OpenStreetMap(열린 지도 데이터)에서 전국 감자탕 가게 수집 — API 키 필요 없음
   - 오픈스트리트맵은 누구나 쓸 수 있는 공개 지도 데이터예요 (ODbL 라이선스, 출처 표기 필요)
   - 가져오는 정보: 가게 이름, 위치(좌표), 주소·전화·영업시간(등록돼 있을 때만)

   실행: node tools/collect-osm.mjs
   결과: js/data-real.js
   ========================================================= */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const QUERY = `[out:json][timeout:120];
area["ISO3166-1"="KR"][admin_level=2]->.kr;
(
  nwr["amenity"~"restaurant|fast_food|food_court"]["name"~"감자탕|뼈해장국|감자국|뼈다귀"](area.kr);
  nwr["amenity"~"restaurant|fast_food"]["cuisine"~"gamjatang|pork_bone|haejangguk"](area.kr);
);
out center tags;`;

async function overpass() {
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "gamjatang-gamboelsaya-prototype/0.1" }, body: "data=" + encodeURIComponent(QUERY) });
      if (!res.ok) { console.error(`${ep} → ${res.status}`); continue; }
      return await res.json();
    } catch (e) { console.error(`${ep} → ${e.message}`); }
  }
  throw new Error("모든 Overpass 서버 연결 실패");
}

/* 좌표 → 사이트 지역 (대략적인 경계, 주소 태그가 있으면 주소 우선) */
function regionOf(t, lat, lng) {
  const a = [t["addr:province"], t["addr:city"], t["addr:full"], t["addr:street"], t["is_in"]].filter(Boolean).join(" ");
  const byText = [["서울", "서울"], ["인천", "인천"], ["경기", "경기"], ["강원", "강원"], ["대전", "충청"], ["세종", "충청"], ["충청", "충청"], ["충북", "충청"], ["충남", "충청"],
    ["대구", "대구·경북"], ["경상북", "대구·경북"], ["경북", "대구·경북"], ["부산", "부산·경남"], ["울산", "부산·경남"], ["경상남", "부산·경남"], ["경남", "부산·경남"],
    ["광주", "전라"], ["전라", "전라"], ["전북", "전라"], ["전남", "전라"], ["제주", "제주"]];
  for (const [k, v] of byText) if (a.includes(k)) return v;
  if (lat < 34) return "제주";
  if (lat > 37.42 && lat < 37.72 && lng > 126.76 && lng < 127.19) return "서울";
  if (lng < 126.78 && lat > 37.25 && lat < 37.8) return "인천";
  if (lat > 36.95 && lng < 127.85) return "경기";
  if (lat > 37.0 && lng >= 127.85) return "강원";
  if (lat > 37.2 && lng >= 127.5) return "강원";
  if (lat > 35.9 && lng < 128.0) return "충청";
  if (lng >= 128.75 && lat < 35.75) return "부산·경남";
  if (lng >= 127.65 && lat < 35.5) return "부산·경남";
  if (lng >= 128.0) return "대구·경북";
  return "전라";
}

const data = await overpass();
const seen = new Set();
const list = [];
for (const el of data.elements || []) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  const name = (t["name:ko"] || t.name || "").trim();
  if (!name || !lat || !lng) continue;
  const key = name + "|" + lat.toFixed(4) + "|" + lng.toFixed(4);
  if (seen.has(key)) continue;
  seen.add(key);
  const addr = t["addr:full"] || [t["addr:province"], t["addr:city"], t["addr:district"], t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ") || null;
  list.push({
    id: "o" + el.type[0] + el.id,
    name,
    region: regionOf(t, lat, lng),
    district: t["addr:district"] || t["addr:city"] || "",
    address: addr,
    lat: +lat.toFixed(6), lng: +lng.toFixed(6),
    phone: t.phone || t["contact:phone"] || null,
    hours: t.opening_hours || null,
    homepage: t.website || t["contact:website"] || null,
    osm: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  });
}
list.sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(root, "js", "data-real.js"), `/* 자동 생성 파일 — tools/collect-osm.mjs 로 만들었어요.
   출처: © OpenStreetMap contributors (ODbL) · 수집일 ${today} · ${list.length}곳 */
const REAL_SOURCE = { name: "OpenStreetMap", license: "© OpenStreetMap contributors (ODbL)", collectedAt: "${today}", count: ${list.length} };
const REAL_RESTAURANTS = ${JSON.stringify(list).replace(/\},\{/g, "},\n{")};
`, "utf8");
const byRegion = {};
list.forEach((r) => (byRegion[r.region] = (byRegion[r.region] || 0) + 1));
console.log(`완료! ${list.length}곳`, byRegion);
console.log("주소 있음", list.filter((r) => r.address).length, "/ 전화 있음", list.filter((r) => r.phone).length, "/ 영업시간 있음", list.filter((r) => r.hours).length);
