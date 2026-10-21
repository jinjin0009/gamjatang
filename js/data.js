/* =========================================================
   감자탕 감별사 — 기본 데이터
   · 식당: js/data-real.js (OpenStreetMap 에서 수집한 실제 감자탕 가게)를 사용
     data-real.js 가 없을 때만 아래 RESTAURANTS_BASE(가상 예시 식당)를 대신 씀
   · 후기·평점·도장·투표는 실제 사용자 기록으로만 쌓임 (가짜 후기·가짜 통계 없음)
   ========================================================= */

const SITE = { name: "감자탕 감별사", brand: "BONE CLUB", slogan: "FIND YOUR TANG." };

const USE_REAL = typeof REAL_RESTAURANTS !== "undefined" && REAL_RESTAURANTS.length > 0;

const REGIONS = ["서울", "경기", "인천", "강원", "충청", "대구·경북", "부산·경남", "전라", "제주"];

const SCORE_ITEMS = [
  { key: "broth", en: "BROTH POWER", kr: "국물 맛", icon: "pot" },
  { key: "meat", en: "MEAT DENSITY", kr: "고기 양·살코기", icon: "bone" },
  { key: "bone", en: "BONE VALUE", kr: "뼈 발라 먹는 맛", icon: "bone" },
  { key: "rice", en: "FRIED RICE ENDGAME", kr: "볶음밥 만족도", icon: "flame" },
  { key: "value", en: "VALUE FOR MONEY", kr: "가격 대비 만족도", icon: "coin" },
];

const BEST_POINTS = ["국물", "고기 양", "뼈 살코기", "볶음밥", "가격", "분위기", "친절", "김치"];

/* ---------- 식당 (가상) ----------
   parking / solo / open24 : true(가능) · false(불가) · null(미확인)
   base : 예시 후기를 만들 때 쓰는 기준 점수                                   */
const RESTAURANTS_BASE = [
  { id: "s1", name: "뼈대있는집", region: "서울", district: "마포구", lat: 37.553, lng: 126.912, since: 1987, oldSchool: true, isNew: false,
    hours: "10:00 – 22:00 (월 휴무)", price: 2, parking: false, solo: true, open24: false, brothStyle: "진함",
    menus: [["감자탕 (중)", 35000], ["뼈해장국", 10000], ["볶음밥", 3000]], base: { broth: 4.7, meat: 4.1, bone: 4.3, rice: 3.9, value: 4.0 }, n: 8, verifiedSeed: 41,
    intro: "37년째 같은 솥. 국물에서 시간이 느껴지는 마포 노포." },
  { id: "s2", name: "우거지연구소", region: "서울", district: "성동구", lat: 37.544, lng: 127.056, since: 2025, oldSchool: false, isNew: true,
    hours: "11:30 – 21:30", price: 3, parking: null, solo: true, open24: false, brothStyle: "깔끔",
    menus: [["우거지 감자탕 (2인)", 39000], ["1인 뼈전골", 15000], ["트러플 볶음밥", 5000]], base: { broth: 4.2, meat: 3.6, bone: 3.5, rice: 4.4, value: 3.2 }, n: 4, verifiedSeed: 9,
    intro: "성수동 신상. 우거지를 실험실처럼 연구하는 깔끔 국물." },
  { id: "s3", name: "종로뼈다귀", region: "서울", district: "종로구", lat: 37.571, lng: 126.992, since: 1979, oldSchool: true, isNew: false,
    hours: "24시간", price: 1, parking: false, solo: true, open24: true, brothStyle: "진함",
    menus: [["뼈해장국", 9000], ["감자탕 (소)", 26000], ["볶음밥", 2500]], base: { broth: 4.5, meat: 3.8, bone: 4.0, rice: 3.4, value: 4.6 }, n: 7, verifiedSeed: 33,
    intro: "새벽 4시에도 불 켜진 종로의 해장 성지." },
  { id: "s4", name: "골목끝감자탕", region: "서울", district: "은평구", lat: 37.601, lng: 126.919, since: 1992, oldSchool: true, isNew: false,
    hours: "11:00 – 23:00", price: 2, parking: true, solo: false, open24: false, brothStyle: "진함",
    menus: [["감자탕 (대)", 42000], ["감자탕 (중)", 34000], ["라면사리", 2000], ["볶음밥", 3000]], base: { broth: 4.4, meat: 4.6, bone: 4.5, rice: 4.2, value: 4.1 }, n: 6, verifiedSeed: 27,
    intro: "골목 끝까지 걸어갈 가치. 뼈마다 살이 산처럼." },
  { id: "s5", name: "BONE STUDIO", region: "서울", district: "강남구", lat: 37.503, lng: 127.028, since: 2024, oldSchool: false, isNew: true,
    hours: "11:30 – 22:00", price: 3, parking: true, solo: false, open24: false, brothStyle: "깔끔",
    menus: [["시그니처 감자탕 (2인)", 45000], ["한우 사골 뼈탕", 18000], ["치즈 볶음밥", 6000]], base: { broth: 4.0, meat: 4.2, bone: 3.7, rice: 4.6, value: 2.9 }, n: 3, verifiedSeed: 6,
    intro: "강남 한복판, 갤러리 같은 감자탕 다이닝." },
  { id: "s6", name: "야근감자탕", region: "서울", district: "영등포구", lat: 37.521, lng: 126.924, since: 2011, oldSchool: false, isNew: false,
    hours: "24시간", price: 2, parking: null, solo: true, open24: true, brothStyle: "진함",
    menus: [["1인 감자탕", 12000], ["뼈해장국", 10000], ["볶음밥", 3000]], base: { broth: 4.1, meat: 3.9, bone: 3.8, rice: 3.7, value: 4.2 }, n: 5, verifiedSeed: 18,
    intro: "여의도 직장인의 새벽 구원. 1인 감자탕 있음." },
  { id: "g1", name: "수원왕뼈전골", region: "경기", district: "수원시", lat: 37.274, lng: 127.012, since: 2003, oldSchool: false, isNew: false,
    hours: "11:00 – 22:00", price: 2, parking: true, solo: false, open24: false, brothStyle: "진함",
    menus: [["왕뼈전골 (대)", 48000], ["감자탕 (중)", 33000], ["볶음밥", 3000]], base: { broth: 4.0, meat: 4.8, bone: 4.6, rice: 3.8, value: 4.3 }, n: 6, verifiedSeed: 22,
    intro: "뼈 크기부터 반칙. 고기파의 성지." },
  { id: "g2", name: "의정부할매감자탕", region: "경기", district: "의정부시", lat: 37.738, lng: 127.047, since: 1984, oldSchool: true, isNew: false,
    hours: "09:00 – 21:00", price: 1, parking: null, solo: true, open24: false, brothStyle: "진함",
    menus: [["감자탕 (중)", 29000], ["뼈해장국", 8500], ["볶음밥", 2000]], base: { broth: 4.6, meat: 3.9, bone: 4.1, rice: 3.6, value: 4.8 }, n: 5, verifiedSeed: 19,
    intro: "할머니 손맛 그대로 40년. 가성비 끝판왕." },
  { id: "g3", name: "볶음밥클럽", region: "경기", district: "성남시", lat: 37.395, lng: 127.111, since: 2025, oldSchool: false, isNew: true,
    hours: "11:00 – 22:00", price: 2, parking: true, solo: true, open24: false, brothStyle: "깔끔",
    menus: [["감자탕 (중)", 34000], ["날치알 볶음밥", 4000], ["치즈 폭탄 볶음밥", 5000]], base: { broth: 3.7, meat: 3.8, bone: 3.5, rice: 4.9, value: 3.9 }, n: 2, verifiedSeed: 4,
    intro: "감자탕은 거들 뿐. 볶음밥이 메인인 판교 신상." },
  { id: "i1", name: "항구감자탕", region: "인천", district: "중구", lat: 37.474, lng: 126.621, since: 1998, oldSchool: false, isNew: false,
    hours: "10:30 – 22:30", price: 2, parking: true, solo: null, open24: false, brothStyle: "진함",
    menus: [["감자탕 (중)", 33000], ["해물 감자탕", 39000], ["볶음밥", 3000]], base: { broth: 4.2, meat: 4.0, bone: 3.9, rice: 3.8, value: 3.9 }, n: 4, verifiedSeed: 12,
    intro: "바닷바람 맞으며 먹는 인천항 감자탕." },
  { id: "k1", name: "춘천들깨뼈탕", region: "강원", district: "춘천시", lat: 37.881, lng: 127.729, since: 2008, oldSchool: false, isNew: false,
    hours: "10:00 – 21:00", price: 1, parking: true, solo: true, open24: false, brothStyle: "깔끔",
    menus: [["들깨 감자탕 (중)", 30000], ["들깨 뼈해장국", 9000], ["볶음밥", 2500]], base: { broth: 4.4, meat: 3.7, bone: 3.8, rice: 3.5, value: 4.5 }, n: 4, verifiedSeed: 11,
    intro: "들깨가루 듬뿍, 고소함으로 승부하는 춘천집." },
  { id: "k2", name: "강릉바다뼈해장국", region: "강원", district: "강릉시", lat: 37.752, lng: 128.896, since: 2015, oldSchool: false, isNew: false,
    hours: "06:00 – 15:00", price: 1, parking: null, solo: true, open24: false, brothStyle: "진함",
    menus: [["뼈해장국", 9500], ["감자탕 (소)", 27000]], base: { broth: 4.3, meat: 3.6, bone: 3.9, rice: 3.0, value: 4.4 }, n: 2, verifiedSeed: 5,
    intro: "아침 바다 보고 해장 한 그릇. 오후 3시 마감." },
  { id: "c1", name: "대전묵은지뼈탕", region: "충청", district: "대전 중구", lat: 36.326, lng: 127.421, since: 2001, oldSchool: false, isNew: false,
    hours: "11:00 – 22:00", price: 2, parking: false, solo: null, open24: false, brothStyle: "진함",
    menus: [["묵은지 감자탕 (중)", 34000], ["묵은지 뼈해장국", 10000], ["볶음밥", 3000]], base: { broth: 4.5, meat: 3.9, bone: 4.0, rice: 4.1, value: 4.0 }, n: 5, verifiedSeed: 14,
    intro: "3년 묵힌 묵은지가 국물을 지배한다." },
  { id: "c2", name: "청주뼈장인", region: "충청", district: "청주시", lat: 36.638, lng: 127.491, since: 1995, oldSchool: true, isNew: false,
    hours: "10:00 – 21:30", price: 1, parking: true, solo: true, open24: false, brothStyle: null,
    menus: [["감자탕 (중)", 28000], ["뼈해장국", 8000]], base: { broth: 4.1, meat: 4.3, bone: 4.4, rice: 3.3, value: 4.6 }, n: 3, verifiedSeed: 8,
    intro: "뼈 손질 30년 장인의 정직한 한 냄비." },
  { id: "t1", name: "대구매운뼈", region: "대구·경북", district: "중구", lat: 35.869, lng: 128.596, since: 2010, oldSchool: false, isNew: false,
    hours: "11:00 – 24:00", price: 2, parking: false, solo: true, open24: false, brothStyle: "진함",
    menus: [["불 감자탕 (중)", 35000], ["매운 뼈찜", 38000], ["볶음밥", 3000]], base: { broth: 4.4, meat: 4.0, bone: 3.8, rice: 4.3, value: 3.8 }, n: 6, verifiedSeed: 20,
    intro: "대구의 더위보다 매운 국물. 맵부심 환영." },
  { id: "b1", name: "서면새벽감자탕", region: "부산·경남", district: "부산진구", lat: 35.158, lng: 129.059, since: 1999, oldSchool: false, isNew: false,
    hours: "24시간", price: 2, parking: null, solo: true, open24: true, brothStyle: "진함",
    menus: [["감자탕 (중)", 33000], ["뼈해장국", 9500], ["볶음밥", 3000]], base: { broth: 4.3, meat: 4.1, bone: 4.0, rice: 3.9, value: 4.1 }, n: 6, verifiedSeed: 24,
    intro: "서면의 밤은 여기서 끝난다. 24시간 영업." },
  { id: "b2", name: "해운대뼈다귀파티", region: "부산·경남", district: "해운대구", lat: 35.163, lng: 129.163, since: 2025, oldSchool: false, isNew: true,
    hours: "12:00 – 23:00", price: 3, parking: true, solo: false, open24: false, brothStyle: "깔끔",
    menus: [["파티 감자탕 (대)", 52000], ["오션뷰 세트", 60000], ["볶음밥", 4000]], base: { broth: 3.9, meat: 4.4, bone: 4.0, rice: 4.2, value: 3.1 }, n: 3, verifiedSeed: 7,
    intro: "오션뷰 감자탕이라는 새 장르." },
  { id: "b3", name: "동래원조뼈국", region: "부산·경남", district: "동래구", lat: 35.205, lng: 129.084, since: 1975, oldSchool: true, isNew: false,
    hours: "08:00 – 20:00", price: 1, parking: false, solo: true, open24: false, brothStyle: "진함",
    menus: [["뼈국", 8000], ["감자탕 (중)", 28000]], base: { broth: 4.8, meat: 3.8, bone: 4.2, rice: 3.2, value: 4.7 }, n: 7, verifiedSeed: 30,
    intro: "50년 된 동래의 원조 뼈국. 메뉴는 단 두 개." },
  { id: "j1", name: "광주우거지본가", region: "전라", district: "광주 동구", lat: 35.146, lng: 126.923, since: 1990, oldSchool: true, isNew: false,
    hours: "10:00 – 21:00", price: 2, parking: true, solo: null, open24: false, brothStyle: "진함",
    menus: [["우거지 감자탕 (중)", 32000], ["뼈해장국", 9000], ["볶음밥", 3000]], base: { broth: 4.6, meat: 4.2, bone: 4.1, rice: 4.0, value: 4.3 }, n: 5, verifiedSeed: 16,
    intro: "남도 반찬에 우거지 듬뿍. 상다리가 휜다." },
  { id: "j2", name: "전주콩나물뼈탕", region: "전라", district: "전주시", lat: 35.821, lng: 127.148, since: 2012, oldSchool: false, isNew: false,
    hours: "07:00 – 16:00", price: 1, parking: null, solo: true, open24: false, brothStyle: "깔끔",
    menus: [["콩나물 뼈탕", 9000], ["감자탕 (소)", 26000]], base: { broth: 4.2, meat: 3.5, bone: 3.6, rice: 3.1, value: 4.5 }, n: 1, verifiedSeed: 3,
    intro: "콩나물국밥의 도시가 만든 시원한 뼈탕." },
  { id: "jj1", name: "제주흑돼지뼈국", region: "제주", district: "제주시", lat: 33.499, lng: 126.531, since: 2019, oldSchool: false, isNew: false,
    hours: "10:00 – 20:00", price: 3, parking: true, solo: true, open24: false, brothStyle: "진함",
    menus: [["흑돼지 감자탕 (중)", 42000], ["흑돼지 뼈국", 13000], ["볶음밥", 4000]], base: { broth: 4.5, meat: 4.5, bone: 4.3, rice: 3.9, value: 3.4 }, n: 4, verifiedSeed: 10,
    intro: "흑돼지 뼈로 끓인 제주 한정판 국물." },
];

/* 가상 주소·번호 (실제 식당 정보와 혼동되지 않도록 "예시로", 0000 번호 사용) */
RESTAURANTS_BASE.forEach((r, i) => {
  r.address = (r.district.includes(" ") ? r.district : `${r.region} ${r.district}`) + ` 예시로 ${12 + i * 7}`;
  r.phone = `0000-${String(i + 1).padStart(4, "0")}`;
  r.mapUrl = null; // 실제 식당 등록 시 지도 서비스 링크를 넣으면 길찾기 버튼이 켜짐
});

/* 썸네일 색 팔레트 (식당 이미지 대신 쓰는 기본 그래픽) */
const THUMB_PALETTE = [
  ["#E8381B", "#151515"], ["#C7FF3D", "#151515"], ["#151515", "#C7FF3D"], ["#FF7A1A", "#151515"],
  ["#F5F0E6", "#E8381B"], ["#3D5AFE", "#F5F0E6"], ["#F2C14E", "#151515"], ["#2BB673", "#151515"],
];

/* ---------- 가상 사용자 ---------- */
const SAMPLE_USERS = [
  { id: "su1", nick: "국물요정", bio: "국물 첫 숟갈로 모든 걸 판단합니다", color: "#E8381B", mbti: "SOUP", sampleXp: 640, joined: "2026-03-02" },
  { id: "su2", nick: "뼈발라기장인", bio: "젓가락 하나로 뼈 사이 살 끝까지", color: "#C7FF3D", mbti: "BONE", sampleXp: 1120, joined: "2026-02-11" },
  { id: "su3", nick: "볶음밥엔딩", bio: "볶음밥 안 먹으면 집에 안 감", color: "#FF7A1A", mbti: "RICE", sampleXp: 310, joined: "2026-05-20" },
  { id: "su4", nick: "노포순례자", bio: "간판 바랜 집만 골라 다닙니다", color: "#F2C14E", mbti: "OLD", sampleXp: 880, joined: "2026-01-08" },
  { id: "su5", nick: "만원의행복", bio: "가성비 감자탕 지도 제작 중", color: "#2BB673", mbti: "VALUE", sampleXp: 220, joined: "2026-06-30" },
  { id: "su6", nick: "감자탕원정대", bio: "전국 도장깨기 진행률 38%", color: "#3D5AFE", mbti: "EXPLORER", sampleXp: 1430, joined: "2025-12-24" },
  { id: "su7", nick: "해장국러버", bio: "아침 7시 뼈해장국 클럽", color: "#B983FF", mbti: "SOUP", sampleXp: 150, joined: "2026-08-14" },
  { id: "su8", nick: "우거지파", bio: "우거지 없으면 감자탕 아님", color: "#151515", mbti: "OLD", sampleXp: 470, joined: "2026-04-03" },
];

/* ---------- 예시 후기 자동 생성 (고정 시드 → 매번 같은 결과) ---------- */
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REVIEW_LINES = {
  broth: ["국물이 진짜 진하다. 뼈 우린 시간이 느껴짐.", "첫 숟갈에 해장 끝. 국물은 무조건 리필.", "들깨 향이 과하지 않고 깔끔하게 떨어져요.", "국물 색부터 다름. 걸쭉한데 느끼하지 않음."],
  meat: ["뼈마다 살이 두툼하게 붙어 있어서 발라 먹는 재미가 있음.", "고기 양 미쳤어요. 둘이 가서 중 시켰는데 남김.", "살코기가 부드럽게 쏙쏙 빠져요."],
  bone: ["뼈 사이 살까지 야무지게 붙어 있음. 젓가락 장인 환영.", "등뼈가 큼직해서 발라 먹는 맛이 있다."],
  rice: ["볶음밥은 꼭 드세요. 바닥 누룽지가 본편.", "치즈 볶음밥 추가 강추. 여기서 하루 끝냄.", "볶음밥 때문에 다시 올 듯."],
  value: ["이 가격에 이 양이면 무조건 재방문.", "가격 착하고 반찬도 넉넉해요.", "가격이 살짝 있는 편이지만 납득됨."],
  old: ["벽에 붙은 메뉴판부터 맛집 포스. 사장님 손맛 그대로.", "몇십 년째 같은 자리, 같은 맛이라는 게 느껴짐."],
  etc: ["웨이팅 20분 했는데 할 만했다.", "김치가 맛있어서 리필 두 번 함.", "우거지가 듬뿍 들어가서 좋았어요.", "직원분들 친절하고 회전 빨라요.", "혼밥하기 편한 분위기."],
};

/* 가상 예시 후기 — 실제 식당 데이터를 쓸 때는 만들지 않음 */
const SAMPLE_REVIEWS = USE_REAL ? [] : (function buildSampleReviews() {
  const out = [];
  const rnd = seededRandom(20261020);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v) => Math.max(1, Math.min(5, Math.round(v)));
  RESTAURANTS_BASE.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const scores = {};
      SCORE_ITEMS.forEach((it) => {
        const optional = it.key === "bone" ? 0.2 : it.key === "rice" ? 0.3 : 0;
        if (rnd() < optional) return;
        scores[it.key] = clamp(r.base[it.key] + (rnd() - 0.5) * 1.8);
      });
      const top = Object.entries(r.base).sort((a, b) => b[1] - a[1])[0][0];
      const lines = [pick(REVIEW_LINES[top])];
      if (r.oldSchool && rnd() < 0.5) lines.push(pick(REVIEW_LINES.old));
      else if (rnd() < 0.7) lines.push(pick(REVIEW_LINES.etc));
      const user = SAMPLE_USERS[(ri * 3 + i * 5) % SAMPLE_USERS.length];
      const day = 1 + Math.floor(rnd() * 160);
      const date = new Date(Date.UTC(2026, 4, 1) + day * 86400000).toISOString();
      out.push({
        id: `sr_${r.id}_${i}`, rid: r.id, uid: user.id, sample: true,
        scores, text: lines.join(" "), date,
        opts: { revisit: rnd() < 0.8, best: [pick(BEST_POINTS)] },
        visit: rnd() < 0.55 ? "verified" : "self",
        seedLikes: Math.floor(rnd() * rnd() * 40),
        xp: 20,
      });
    }
  });
  return out;
})();

/* ---------- 감자탕 MBTI ---------- */
const MBTI_TYPES = {
  SOUP: {
    key: "SOUP", name: "SOUP PSYCHOPATH", kr: "국물 사이코패스", color: "#E8381B", ink: "#F5F0E6", icon: "pot",
    one: "국물 맛에 진심인 유형",
    desc: "냄비가 나오면 고기보다 국자부터 잡는 당신. 국물 첫 숟갈로 그 집의 모든 것을 판단합니다. 뼈를 몇 시간 우렸는지 혀로 계산할 수 있는 수준.",
    likes: ["진하고 묵직한 국물", "들깨·우거지 향", "국물 리필 가능한 집"],
    filter: { sort: "broth" }, filterLabel: "국물 점수 높은 순", mission: "soup-three",
  },
  BONE: {
    key: "BONE", name: "BONE COLLECTOR", kr: "뼈 수집가", color: "#151515", ink: "#C7FF3D", icon: "bone",
    one: "고기와 살코기 양이 중요한 유형",
    desc: "감자탕의 본질은 뼈와 살. 냄비 속 뼈 개수를 세고, 살코기 붙은 정도로 별점을 매깁니다. 젓가락 기술은 이미 장인 레벨.",
    likes: ["큼직한 등뼈", "뼈마다 두툼한 살", "푸짐한 대(大) 사이즈"],
    filter: { sort: "meat" }, filterLabel: "고기 점수 높은 순", mission: "five-visits",
  },
  RICE: {
    key: "RICE", name: "FRIED RICE FINAL BOSS", kr: "볶음밥 최종보스", color: "#FF7A1A", ink: "#151515", icon: "flame",
    one: "볶음밥까지 먹어야 식사가 완성되는 유형",
    desc: "감자탕은 볶음밥을 위한 빌드업일 뿐. 국물을 적당히 남겨두는 전략가이며, 바닥 누룽지를 긁는 순간 엔딩 크레딧이 올라갑니다.",
    likes: ["치즈·날치알 볶음밥", "바닥 누룽지", "볶음밥 맛집 리스트"],
    filter: { sort: "rice" }, filterLabel: "볶음밥 점수 높은 순", mission: "rice-three",
  },
  OLD: {
    key: "OLD", name: "OLD SCHOOL TANG", kr: "올드스쿨 탕", color: "#F2C14E", ink: "#151515", icon: "stamp",
    one: "오래된 노포와 전통적인 맛을 선호하는 유형",
    desc: "간판이 바랠수록 설레는 당신. 신상 맛집보다 30년 같은 자리를 지킨 집을 믿습니다. 메뉴가 적을수록, 사장님이 무뚝뚝할수록 점수 상승.",
    likes: ["노포 분위기", "변하지 않는 맛", "짧고 굵은 메뉴판"],
    filter: { sort: "rating" }, filterLabel: "사용자 평점 높은 순", mission: "ten-visits",
  },
  VALUE: {
    key: "VALUE", name: "VALUE HUNTER", kr: "가성비 헌터", color: "#2BB673", ink: "#151515", icon: "coin",
    one: "가격 대비 만족도를 중요하게 생각하는 유형",
    desc: "만 원의 행복을 아는 사람. 같은 맛이면 더 싸게, 같은 가격이면 더 많이. 당신의 가성비 지도는 친구들 사이에서 이미 유명합니다.",
    likes: ["착한 가격", "넉넉한 반찬", "1인 메뉴"],
    filter: { sort: "value" }, filterLabel: "가성비 점수 높은 순", mission: "three-regions",
  },
  EXPLORER: {
    key: "EXPLORER", name: "TANG EXPLORER", kr: "탕 익스플로러", color: "#3D5AFE", ink: "#F5F0E6", icon: "compass",
    one: "새로운 맛집을 찾아다니는 유형",
    desc: "단골집? 그게 뭐죠. 안 가본 동네, 막 문을 연 신상 매장이 당신의 놀이터. 전국 도장깨기 지도를 가장 먼저 완성할 유형.",
    likes: ["신규 오픈 매장", "다른 지역 원정", "아직 후기가 적은 집"],
    filter: { sort: "fewest" }, filterLabel: "아직 후기 적은 가게부터", mission: "pioneer",
  },
};
const MBTI_ORDER = ["SOUP", "BONE", "RICE", "OLD", "VALUE", "EXPLORER"];

const MBTI_QUESTIONS = [
  { q: "감자탕 국물, 첫 숟가락에 원하는 건?", a: [
    { t: "진하고 묵직하게. 뼈 우린 시간이 느껴져야 함", s: { SOUP: 2, OLD: 1 } },
    { t: "깔끔하고 담백하게. 끝까지 술술 넘어가게", s: { EXPLORER: 1, VALUE: 1 } } ] },
  { q: "냄비가 나왔다. 제일 먼저 확인하는 건?", a: [
    { t: "뼈에 붙은 살코기 양", s: { BONE: 2 } },
    { t: "국물 색과 향", s: { SOUP: 2 } },
    { t: "메뉴판 속 볶음밥 종류", s: { RICE: 2 } } ] },
  { q: "오늘 갈 감자탕집을 고른다면?", a: [
    { t: "간판 바랜 30년 노포", s: { OLD: 2 } },
    { t: "SNS에서 본 신상 매장", s: { EXPLORER: 2 } },
    { t: "가성비 검증된 동네 가게", s: { VALUE: 2 } } ] },
  { q: "감자탕 먹고 볶음밥은?", a: [
    { t: "필수. 볶음밥 없으면 식사 미완료", s: { RICE: 3 } },
    { t: "배부르면 과감히 패스", s: { BONE: 1, SOUP: 1 } },
    { t: "국물에 밥 말아 먹는 파", s: { SOUP: 1, OLD: 1 } } ] },
  { q: "둘 중 하나만 고르라면?", a: [
    { t: "넘치게 푸짐한 양", s: { BONE: 2 } },
    { t: "합리적인 가격", s: { VALUE: 2 } } ] },
  { q: "주말 감자탕 약속, 당신의 픽은?", a: [
    { t: "안 가본 지역으로 원정", s: { EXPLORER: 2 } },
    { t: "늘 가던 단골집", s: { OLD: 2 } },
    { t: "최근 찾아둔 가성비 맛집", s: { VALUE: 1, EXPLORER: 1 } } ] },
  { q: "뼈를 대하는 당신의 자세는?", a: [
    { t: "젓가락 장인. 뼈 사이 살까지 끝까지 발라냄", s: { BONE: 2 } },
    { t: "국물 위주, 뼈는 거들 뿐", s: { SOUP: 2 } },
    { t: "볶음밥을 위해 배를 비워둠", s: { RICE: 2 } } ] },
  { q: "감자탕 후기 첫 문장을 쓴다면?", a: [
    { t: "\"국물이 미쳤다\"", s: { SOUP: 1 } },
    { t: "\"고기가 산처럼 쌓여 나옴\"", s: { BONE: 1 } },
    { t: "\"이 가격에 이게 된다고?\"", s: { VALUE: 2 } },
    { t: "\"여기 아는 사람 손?\"", s: { EXPLORER: 2 } } ] },
];

/* ---------- 감자탕 월드컵 ---------- */
const WC_MENU = [
  { id: "m1", name: "우거지 감자탕", sub: "우거지 듬뿍, 구수한 정석", color: "#2BB673", search: "우거지" },
  { id: "m2", name: "묵은지 감자탕", sub: "새콤하게 익은 김치의 한 방", color: "#E8381B", search: "묵은지" },
  { id: "m3", name: "뼈해장국", sub: "1인 1뚝배기, 해장의 정석", color: "#151515", search: "해장국" },
  { id: "m4", name: "들깨 감자탕", sub: "고소함 MAX, 들깨가루 폭탄", color: "#F2C14E", search: "들깨" },
  { id: "m5", name: "얼큰 매운 감자탕", sub: "땀 흘리며 먹는 불맛", color: "#FF7A1A", search: "매운" },
  { id: "m6", name: "고기 듬뿍 감자탕", sub: "뼈 산, 살코기 산맥", color: "#B983FF", search: "", preset: { meat: "4", sort: "meat" } },
  { id: "m7", name: "국물 진한 감자탕", sub: "몇 시간 우린 진국", color: "#3D5AFE", search: "", preset: { broth: "진함", sort: "broth" } },
  { id: "m8", name: "치즈 볶음밥 엔딩", sub: "감자탕의 진짜 엔딩", color: "#C7FF3D", search: "볶음밥", preset: { rice: "4", sort: "rice" } },
];

/* 월드컵 예시 통계 (백엔드 연결 전 시안용 가상 수치) */
const WC_SEED = {
  menu: { sessions: 0, items: {} },
  restaurant: { sessions: 0, items: {} },
};
/* 실제 식당 데이터를 쓰는 지금은 월드컵 통계를 0에서 시작 (실제 투표만 집계) */

/* ---------- 미션 · 배지 · 레벨 ---------- */
const BADGES = {
  FIRST_TANG: { name: "FIRST TANG", kr: "첫 감자탕집 방문", color: "#C7FF3D", icon: "pin" },
  REVIEW_STARTER: { name: "REVIEW STARTER", kr: "첫 후기 작성", color: "#FF7A1A", icon: "edit" },
  BONE_COLLECTOR: { name: "BONE COLLECTOR", kr: "감자탕집 5곳 방문", color: "#151515", icon: "bone" },
  SOUP_EXPERT: { name: "SOUP EXPERT", kr: "국물 맛집 3곳 방문", color: "#E8381B", icon: "pot" },
  FRIED_RICE_LOVER: { name: "FRIED RICE LOVER", kr: "볶음밥 후기 3개", color: "#F2C14E", icon: "flame" },
  OLD_SCHOOL: { name: "TANG VETERAN", kr: "감자탕집 10곳 방문", color: "#B983FF", icon: "stamp" },
  LOCAL_LEGEND: { name: "LOCAL LEGEND", kr: "한 지역 도장 완성", color: "#3D5AFE", icon: "trophy" },
  TANG_EXPLORER: { name: "TANG EXPLORER", kr: "서로 다른 지역 3곳", color: "#2BB673", icon: "compass" },
  VERIFIED: { name: "REAL VISITOR", kr: "첫 방문 인증 완료", color: "#F5F0E6", icon: "shield" },
};

/* metric: 진행도 계산 기준 (store.js 의 progress 에서 계산) · goal "all" = 해당 지역 전체 */
const MISSIONS = [
  { id: "first-visit", title: "첫 번째 감자탕집 방문", desc: "아무 감자탕집에서 방문 기록 남기기", metric: "visits", goal: 1, xp: 30, badge: "FIRST_TANG", group: "기본" },
  { id: "first-review", title: "첫 후기 작성", desc: "REVIEW & EARN XP로 후기 1개 남기기", metric: "reviews", goal: 1, xp: 20, badge: "REVIEW_STARTER", group: "기본" },
  { id: "verified-one", title: "첫 방문 인증", desc: "영수증 인증이 승인된 방문 1회", metric: "verified", goal: 1, xp: 20, badge: "VERIFIED", group: "기본" },
  { id: "pioneer", title: "개척자", desc: "후기가 하나도 없던 가게에 첫 후기 남기기", metric: "pioneerReviews", goal: 1, xp: 30, badge: null, group: "기본" },
  { id: "five-visits", title: "감자탕집 5곳 방문", desc: "서로 다른 식당 5곳 도장 모으기", metric: "visits", goal: 5, xp: 100, badge: "BONE_COLLECTOR", group: "수집" },
  { id: "three-regions", title: "서로 다른 지역 3곳 탐험", desc: "3개 지역에서 도장 모으기", metric: "regions", goal: 3, xp: 80, badge: "TANG_EXPLORER", group: "수집" },
  { id: "soup-three", title: "국물 감별 3회", desc: "국물(BROTH) 4점 이상을 준 후기 3개", metric: "soupReviews", goal: 3, xp: 60, badge: "SOUP_EXPERT", group: "취향" },
  { id: "rice-three", title: "볶음밥 후기 3개 작성", desc: "볶음밥 항목을 평가한 후기 3개", metric: "riceReviews", goal: 3, xp: 60, badge: "FRIED_RICE_LOVER", group: "취향" },
  { id: "ten-visits", title: "감자탕집 10곳 방문", desc: "서로 다른 식당 10곳 도장 모으기", metric: "visits", goal: 10, xp: 150, badge: "OLD_SCHOOL", group: "취향" },
  { id: "seoul-all", title: "서울 감자탕 도장깨기", desc: "서울 감자탕집 10곳 방문", metric: "region:서울", goal: 10, xp: 150, badge: "LOCAL_LEGEND", group: "지역" },
  { id: "busan-all", title: "부산·경남 감자탕 도장깨기", desc: "부산·울산·경남 감자탕집 5곳 방문", metric: "region:부산·경남", goal: 5, xp: 150, badge: "LOCAL_LEGEND", group: "지역" },
];

const LEVEL_NAMES = ["NEWBIE", "TANG ROOKIE", "BONE HUNTER", "TANG EXPLORER", "BONE MASTER"];

/* 관리자가 조정할 수 있는 기본값 */
const DEFAULT_CONFIG = {
  xp: { review: 20, verified: 30, photo: 10, newRegion: 15 },
  levels: [0, 100, 300, 600, 1000],
};

const ADMIN_EMAILS = ["admin@boneclub.test"]; // 데모용 관리자 계정
