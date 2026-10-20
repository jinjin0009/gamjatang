/* =========================================================
   네이버 검색 API(지역 검색)로 전국 감자탕 가게 수집
   - 네이버 지도 화면을 긁어오는(크롤링) 방식이 아니라, 네이버가 공식 제공하는
     무료 검색 API를 사용합니다. (하루 25,000회 무료)
   - 가져오는 정보: 가게 이름, 주소, 업종 분류, 위치(좌표)
   - 네이버의 별점·리뷰·사진은 가져오지 않습니다. (사이트 평점은 우리 사용자 후기로만 계산)

   실행: node tools/collect-naver.mjs
   키:  tools/naver-key.json  →  { "id": "Client ID", "secret": "Client Secret" }
   결과: js/data-real.js
   ========================================================= */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

let key;
try {
  key = JSON.parse(readFileSync(join(here, "naver-key.json"), "utf8"));
} catch {
  console.error("tools/naver-key.json 파일이 없거나 형식이 잘못됐어요.");
  process.exit(1);
}
if (!key.id || !key.secret) { console.error("naver-key.json 에 id 와 secret 을 넣어 주세요."); process.exit(1); }

/* 검색할 지역 (지역명 + "감자탕") — 지역 검색 API는 한 번에 최대 5곳만 주므로 지역을 잘게 나눔 */
const AREAS = {
  서울: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "서울 중구", "중랑구", "응암동"],
  경기: ["수원", "성남", "분당", "고양 일산", "용인", "부천", "안산", "안양", "남양주", "화성 동탄", "평택", "의정부", "시흥", "파주", "김포", "광명", "광주시 경기", "군포", "하남", "오산", "이천", "안성", "의왕", "양주", "구리", "포천", "동두천", "과천", "여주", "양평", "가평", "연천"],
  인천: ["인천 중구", "인천 동구", "인천 미추홀구", "인천 연수구", "인천 남동구", "인천 부평구", "인천 계양구", "인천 서구", "강화"],
  강원: ["춘천", "원주", "강릉", "동해", "태백", "속초", "삼척", "홍천", "횡성", "영월", "평창", "정선", "철원", "양구", "인제", "고성 강원", "양양"],
  충청: ["대전 동구", "대전 중구", "대전 서구", "대전 유성구", "대전 대덕구", "세종", "청주", "충주", "제천", "보은", "옥천", "진천", "음성", "천안", "공주", "보령", "아산", "서산", "논산", "당진", "홍성", "예산", "태안"],
  대구경북: ["대구 중구", "대구 동구", "대구 서구", "대구 남구", "대구 북구", "대구 수성구", "대구 달서구", "달성", "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산", "칠곡", "울진"],
  부산경남: ["부산 중구", "부산 서구", "부산 동구", "영도", "부산진구 서면", "동래", "부산 남구", "부산 북구", "해운대", "사하", "금정", "부산 강서구", "연제", "수영", "사상", "기장", "울산 중구", "울산 남구", "울산 동구", "울산 북구", "울주", "창원", "마산", "진주", "통영", "사천", "김해", "밀양", "거제", "양산", "함안", "거창"],
  전라: ["광주 동구", "광주 서구", "광주 남구", "광주 북구", "광주 광산구", "전주", "군산", "익산", "정읍", "남원", "김제", "완주", "목포", "여수", "순천", "나주", "광양", "담양", "해남", "무안"],
  제주: ["제주시", "서귀포"],
};

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const url = "https://openapi.naver.com/v1/search/local.json?display=5&start=1&sort=comment&query=" + encodeURIComponent(query);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "X-Naver-Client-Id": key.id, "X-Naver-Client-Secret": key.secret } });
    if (res.status === 429) { await sleep(1500); continue; }
    if (res.status === 401) throw new Error("API 키가 틀렸어요 (401). Client ID / Secret 을 다시 확인해 주세요.");
    if (!res.ok) throw new Error(`네이버 API 오류 ${res.status}: ${await res.text()}`);
    return (await res.json()).items || [];
  }
  return [];
}

/* 주소 첫 단어 → 사이트 지역 */
function regionOf(addr) {
  const a = addr.split(" ")[0] || "";
  if (a.startsWith("서울")) return "서울";
  if (a.startsWith("경기")) return "경기";
  if (a.startsWith("인천")) return "인천";
  if (a.startsWith("강원")) return "강원";
  if (/^(대전|세종|충청|충북|충남)/.test(a)) return "충청";
  if (/^(대구|경상북|경북)/.test(a)) return "대구·경북";
  if (/^(부산|울산|경상남|경남)/.test(a)) return "부산·경남";
  if (/^(광주|전라|전북|전남)/.test(a)) return "전라";
  if (a.startsWith("제주")) return "제주";
  return null;
}

/* 네이버 좌표: 2023년 이후 WGS84 × 10,000,000 정수 */
function toLatLng(mapx, mapy) {
  const x = Number(mapx), y = Number(mapy);
  if (!x || !y) return null;
  const lng = x > 1e8 ? x / 1e7 : null, lat = y > 1e7 ? y / 1e7 : null;
  if (!lng || !lat || lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;
  return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
}

const isGamjatang = (it) => /감자탕|뼈해장국|뼈다귀/.test(strip(it.title) + " " + it.category);

const found = new Map();
let calls = 0;
const queries = Object.values(AREAS).flat();
console.log(`검색어 ${queries.length}개로 수집 시작...`);
for (const area of queries) {
  for (const word of ["감자탕", "뼈해장국"]) {
    let items;
    try { items = await search(`${area} ${word}`); } catch (e) { console.error(e.message); process.exit(1); }
    calls++;
    for (const it of items) {
      if (!isGamjatang(it)) continue;
      const addr = it.roadAddress || it.address;
      const pos = toLatLng(it.mapx, it.mapy);
      const region = regionOf(it.address || addr);
      if (!pos || !region) continue;
      const name = strip(it.title);
      const k = name + "|" + (it.address || addr);
      if (found.has(k)) continue;
      const parts = (it.address || addr).split(" ");
      found.set(k, {
        name, region,
        // 광역시는 "부산 중구"처럼 도시 이름을 붙여 구분
        district: /광역시|특별자치시/.test(parts[0]) ? `${parts[0].replace(/광역시|특별자치시/, "")} ${parts[1] || ""}`.trim() : parts[1] || "",
        address: addr,
        jibun: it.address || null,
        lat: pos.lat, lng: pos.lng,
        category: it.category || null,
        phone: it.telephone || null,
        homepage: it.link || null,
      });
    }
    await sleep(120);
  }
  process.stdout.write(`\r진행 ${calls}/${queries.length * 2}  수집 ${found.size}곳`);
}
console.log("");

/* 식당 id 는 이름+주소로 고정 (다시 수집해도 같은 가게는 같은 id → 후기·도장 유지) */
function hashId(s) {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return "n" + (h >>> 0).toString(36);
}
const list = [...found.entries()].map(([k, r]) => Object.assign({ id: hashId(k) }, r))
  .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name));

const out = `/* 자동 생성 파일 — tools/collect-naver.mjs 로 만들었어요. 직접 고치지 마세요.
   출처: 네이버 검색 API(지역 검색) · 수집일 ${new Date().toISOString().slice(0, 10)} · ${list.length}곳
   가게 이름·주소·업종·좌표만 담았어요. 영업시간·가격·주차 등은 확인 전이라 '미확인'으로 표시돼요. */
const REAL_SOURCE = { name: "네이버 검색 API", collectedAt: "${new Date().toISOString().slice(0, 10)}", count: ${list.length} };
const REAL_RESTAURANTS = ${JSON.stringify(list, null, 0).replace(/\},\{/g, "},\n{")};
`;
writeFileSync(join(root, "js", "data-real.js"), out, "utf8");
console.log(`완료! ${list.length}곳 → js/data-real.js (API 호출 ${calls}회)`);
