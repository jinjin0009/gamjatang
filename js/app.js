/* =========================================================
   App — 상단 메뉴, 모바일 하단 탭, 푸터, 시작
   ========================================================= */

const NAV = [
  { path: "/", label: "HOME", kr: "홈", icon: "home" },
  { path: "/map", label: "MAP", kr: "지도", icon: "map" },
  { path: "/mbti", label: "MBTI", kr: "MBTI", icon: "spark" },
  { path: "/worldcup", label: "WORLD CUP", kr: "월드컵", icon: "trophy" },
  { path: "/stamp", label: "STAMP TOUR", kr: "도장깨기", icon: "stamp" },
  { path: "/profile", label: "PROFILE", kr: "프로필", icon: "user" },
];
const TABBAR = ["/", "/map", "/worldcup", "/stamp", "/profile"];
const REGION_SLUGS = { 서울: "seoul", 경기: "gyeonggi", 인천: "incheon", 강원: "gangwon", 충청: "chungcheong", "대구·경북": "daegu-gyeongbuk", "부산·경남": "busan-gyeongnam", 전라: "jeolla", 제주: "jeju" };

const App = {
  renderChrome(path) {
    const me = Store.me();
    const isOn = (p) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/") || (p === "/map" && path.startsWith("/r/")) || (p === "/profile" && path.startsWith("/u/")));
    let right;
    if (me) {
      const lv = Store.progress(me.id).level;
      right = `<a class="gnb__me" href="#/profile" aria-label="내 프로필">${avatarHTML(me, 32)}<b>${esc(me.nick)}</b>${levelChip(lv)}</a>`;
    } else {
      right = `<a class="btn btn--sm btn--lime" href="#/login?next=${encodeURIComponent(Router.current())}">LOGIN</a>`;
    }
    $("#gnb").innerHTML = `<div class="wrap gnb">
      <a class="logo" href="#/" aria-label="감자탕 감별사 홈"><span class="logo__mark">${icon("bone")}</span>
        <span class="logo__txt"><span class="logo__kr">${SITE.name}</span><span class="logo__en">${SITE.brand} · ${SITE.slogan}</span></span></a>
      <nav class="gnb__nav" aria-label="주요 메뉴">${NAV.map((n) => `<a href="#${n.path}" class="${isOn(n.path) ? "is-active" : ""}">${n.label}</a>`).join("")}</nav>
      <div class="gnb__right">${me && me.role === "admin" ? `<a class="btn btn--sm btn--ink gnb__admin" href="#/admin">${icon("shield")} ADMIN</a>` : ""}${right}</div>
    </div>`;
    $("#tabbar").innerHTML = TABBAR.map((p) => {
      const n = NAV.find((x) => x.path === p);
      return `<a href="#${p}" class="${isOn(p) ? "is-active" : ""}">${icon(n.icon)}<span>${n.kr}</span></a>`;
    }).join("");
    const noFooter = path === "/map" || path === "/login";
    // 화면마다 브라우저 탭 제목을 바꿈 (식당·MBTI 결과 화면은 각 화면에서 더 자세히 설정)
    const TITLES = { "/": "감자탕 감별사 — 전국 감자탕 맛집 지도 · 감자탕 MBTI · 월드컵", "/map": "감자탕 맛집 지도", "/mbti": "감자탕 MBTI 테스트", "/mbti/test": "감자탕 MBTI 테스트",
      "/worldcup": "감자탕 월드컵", "/stamp": "감자탕 도장깨기", "/profile": "내 프로필", "/login": "로그인 · 회원가입", "/admin": "관리자" };
    const base = Object.keys(TITLES).filter((p) => path === p || (p !== "/" && path.startsWith(p + "/"))).sort((a, b) => b.length - a.length)[0];
    document.title = path === "/" ? TITLES["/"] : `${TITLES[base] || "감자탕 감별사"} | 감자탕 감별사`;
    $("#app").classList.toggle("no-footer", noFooter);
  },

  renderProtoBar() {
    let hide = false;
    try { hide = sessionStorage.getItem("bc_hide_proto") === "1"; } catch (e) {}
    const bar = $("#proto-bar");
    if (hide) { bar.innerHTML = ""; return; }
    bar.innerHTML = `<div class="wrap"><b>PROTOTYPE</b><span class="pb-short">실제 가게 정보 · 기록은 이 브라우저에만 저장</span><span class="pb-long">가게 정보는 <u>실제 데이터</u>(OpenStreetMap)예요 · 로그인과 후기·도장 기록은 아직 <u>이 브라우저에만</u> 저장돼요.</span><button aria-label="안내 닫기">${icon("x")}</button></div>`;
    $("button", bar).onclick = () => { try { sessionStorage.setItem("bc_hide_proto", "1"); } catch (e) {} bar.innerHTML = ""; };
  },

  renderFooter() {
    $("#footer").innerHTML = `<div class="wrap footer">
      <div><div class="footer__big">FIND<br>YOUR TANG.</div><p class="mt small" style="opacity:.7">${SITE.name} (${SITE.brand}) — 감자탕 맛집 탐험을 게임처럼.<br>가게 정보: © OpenStreetMap contributors (ODbL). 폐업·이전 등으로 실제와 다를 수 있어요. 평점과 후기는 감별사 사용자 기록으로만 계산해요.</p></div>
      <div><h4>EXPLORE</h4><a href="#/map">맛집 지도</a><a href="#/mbti">감자탕 MBTI</a><a href="#/worldcup">감자탕 월드컵</a><a href="#/stamp">도장깨기</a></div>
      <div><h4>지역별 감자탕</h4>${REGIONS.map((g) => `<a href="region/${REGION_SLUGS[g]}.html">${g} 감자탕 맛집</a>`).join("")}</div>
      <div><h4>ACCOUNT · INFO</h4><a href="#/profile">내 프로필</a><a href="#/login">로그인 · 회원가입</a><a href="faq.html">감자탕 FAQ</a><a href="mbti.html">감자탕 MBTI 유형</a><a href="#/admin">관리자</a></div>
    </div>`;
  },

  start() {
    this.renderProtoBar();
    this.renderFooter();
    window.addEventListener("hashchange", () => Router.render());
    Router.render();
  },
};
