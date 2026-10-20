/* 전국 감자탕 맛집 지도 — 검색 · 필터 · 정렬 · 지도 핀 */
const SORTS = [
  ["rating", "사용자 평점순"], ["reviews", "후기 많은 순"], ["fewest", "후기 적은 순 (개척)"], ["dist", "거리순 (내 위치)"],
  ["broth", "국물 점수순"], ["meat", "고기 점수순"], ["rice", "볶음밥 점수순"], ["value", "가성비 점수순"],
];
const FILTER_KEYS = ["q", "region", "sort", "price", "parking", "solo", "open24", "broth", "meat", "rice", "old", "isnew", "preset", "review"];

Router.add("/map", (app, _p, query) => {
  const S = {};
  FILTER_KEYS.forEach((k) => (S[k] = query[k] || ""));
  if (S.preset && MBTI_TYPES[S.preset]) Object.assign(S, MBTI_TYPES[S.preset].filter, query);
  if (!S.sort) S.sort = "rating";
  let bbox = null;         // "현재 지도 영역" 필터
  let myLoc = null;
  let view = "list";
  let firstLoad = true;
  const PAGE = 30;          // 목록은 30곳씩 보여줌 (지도 핀은 전부)
  let limit = PAGE;

  app.innerHTML = `
  <div class="view-toggle"><div class="tabs" id="viewTabs"><button class="is-on" data-v="list">${icon("list")} 목록</button><button data-v="map">${icon("map")} 지도</button></div></div>
  <div class="map-page" data-view="list" id="mapPage">
    <aside class="map-side">
      <div class="map-side__top">
        <div><div class="kicker">${icon("map")} TANG MAP</div><h1 class="h2 mt-s" style="font-size:32px">전국 감자탕 맛집 지도</h1></div>
        <div id="banners"></div>
        <form class="searchbox" id="searchForm" role="search">${icon("search")}<input id="q" type="search" placeholder="식당 이름, 지역, 메뉴 검색" value="${esc(S.q)}" aria-label="검색어"><button type="submit">검색</button></form>
        <div class="chips" id="regionChips">${["", ...REGIONS].map((r) => `<button class="chip ${S.region === r ? "is-on" : ""}" data-region="${r}">${r || "전국"}</button>`).join("")}</div>
        <div class="map-bar">
          <select class="select" id="sort" aria-label="정렬">${SORTS.map(([k, l]) => `<option value="${k}" ${S.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select>
          <button class="chip" id="filterBtn">${icon("filter")} 필터 <b id="fCount"></b></button>
          <button class="chip" id="locBtn">${icon("locate")} 내 주변</button>
        </div>
        <div class="filter-panel" id="filterPanel" hidden>
          <label>가격대<select class="select" data-f="price"><option value="">전체</option><option value="1">₩ 저렴</option><option value="2">₩₩ 보통</option><option value="3">₩₩₩ 높음</option></select></label>
          <label>국물 진하기<select class="select" data-f="broth"><option value="">전체</option><option value="진함">진하고 묵직</option><option value="깔끔">깔끔 담백</option></select></label>
          <label>주차<select class="select" data-f="parking"><option value="">전체</option><option value="y">가능</option><option value="n">불가</option><option value="u">미확인</option></select></label>
          <label>혼밥<select class="select" data-f="solo"><option value="">전체</option><option value="y">가능</option><option value="n">불편</option><option value="u">미확인</option></select></label>
          <label>24시간 영업<select class="select" data-f="open24"><option value="">전체</option><option value="y">24시간</option><option value="n">아님</option></select></label>
          <label>고기 양<select class="select" data-f="meat"><option value="">전체</option><option value="4">고기 점수 4점 이상</option></select></label>
          <label>볶음밥 만족도<select class="select" data-f="rice"><option value="">전체</option><option value="4">볶음밥 4점 이상</option></select></label>
          <label>분위기<select class="select" data-f="old"><option value="">전체</option><option value="1">노포만</option></select></label>
          <label class="full">신규 매장<select class="select" data-f="isnew"><option value="">전체</option><option value="1">신규 등록만</option></select></label>
          <p class="full small muted">주차·혼밥 정보가 확인되지 않은 식당은 '미확인'으로 따로 분류돼요. 점수 필터는 사용자 후기 평균이에요.</p>
          <button class="btn btn--sm full" type="button" id="resetBtn">${icon("refresh")} 필터 전체 초기화</button>
        </div>
        <div class="row gap"><span class="result-count" id="count"></span><span class="spacer"></span><span id="bboxChip"></span></div>
      </div>
      <div class="map-list" id="list" aria-live="polite"></div>
    </aside>
    <section class="map-main"><div class="map-main__sticky">
      <div id="kmap" style="height:100%"></div>
      <div class="map-float"><button class="btn btn--sm btn--lime" id="areaBtn" hidden>${icon("refresh")} 현재 지도 영역에서 다시 찾기</button></div>
      <div id="pinPop"></div>
    </div></section>
  </div>`;

  const page = $("#mapPage", app);
  const listEl = $("#list", app);
  $$("[data-f]", app).forEach((sel) => (sel.value = S[sel.dataset.f] || ""));

  /* 지도 */
  const map = createMap($("#kmap", app), {
    restaurants: [],
    onPin: (id) => showPop(id),
    onMove: (b) => { $("#areaBtn", app).hidden = b.full && !bbox; },
  });
  if (S.region) map.fit(regionBox(S.region), true);

  /* 필터 적용 */
  const tri = (v, f) => (f === "y" ? v === true : f === "n" ? v === false : f === "u" ? v === null || v === undefined : true);
  function filtered() {
    const q = S.q.trim().toLowerCase();
    let rs = Store.restaurants().map((r) => ({ r, st: Store.stats(r.id), d: myLoc ? distKm(myLoc, r) : null }));
    rs = rs.filter(({ r, st }) => {
      if (q) {
        const hay = [r.name, r.region, r.district, r.address || "", ...(r.menus || []).map((m) => m[0]), r.intro || ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (S.region && r.region !== S.region) return false;
      if (S.price && String(r.price) !== S.price) return false;
      if (!tri(r.parking, S.parking) || !tri(r.solo, S.solo) || !tri(r.open24, S.open24)) return false;
      if (S.broth && r.brothStyle !== S.broth) return false;
      if (S.meat && !(st.items.meat.avg >= +S.meat)) return false;
      if (S.rice && !(st.items.rice.avg >= +S.rice)) return false;
      if (S.old && !r.oldSchool) return false;
      if (S.isnew && !r.isNew) return false;
      if (bbox && !(r.lat <= bbox.n && r.lat >= bbox.s && r.lng >= bbox.w && r.lng <= bbox.e)) return false;
      return true;
    });
    const key = { broth: "broth", meat: "meat", rice: "rice", value: "value" }[S.sort];
    rs.sort((a, b) => {
      if (S.sort === "dist" && myLoc) return a.d - b.d;
      if (S.sort === "reviews") return b.st.count - a.st.count || a.r.name.localeCompare(b.r.name);
      if (S.sort === "fewest") return a.st.count - b.st.count || a.r.name.localeCompare(b.r.name);
      if (key) return (b.st.items[key].avg || 0) - (a.st.items[key].avg || 0);
      return (b.st.overall || 0) - (a.st.overall || 0) || b.st.count - a.st.count || a.r.name.localeCompare(b.r.name);
    });
    return rs;
  }

  function syncUrl() {
    const qs = new URLSearchParams();
    FILTER_KEYS.forEach((k) => { if (S[k] && !(k === "sort" && S[k] === "rating")) qs.set(k, S[k]); });
    const s = qs.toString();
    history.replaceState(null, "", "#/map" + (s ? "?" + s : ""));
  }

  function renderBanners() {
    let html = "";
    if (S.preset && MBTI_TYPES[S.preset]) {
      const t = MBTI_TYPES[S.preset];
      html += `<div class="preset-banner" style="background:${t.color};color:${t.ink}">${icon(t.icon)}<span><b>${t.name}</b> 취향 필터 적용 중 · ${t.filterLabel}</span><button data-clear-preset aria-label="취향 필터 해제">${icon("x")}</button></div>`;
    }
    if (S.review) html += `<div class="preset-banner mt-s" style="background:var(--orange);color:var(--ink)">${icon("edit")}<span><b>REVIEW GAME</b> 후기를 남길 식당을 골라 주세요. 상세 화면의 REVIEW & EARN XP 버튼으로 시작해요.</span><button data-clear-review aria-label="안내 닫기">${icon("x")}</button></div>`;
    $("#banners", app).innerHTML = html;
  }

  function render() {
    const rs = filtered();
    const active = ["price", "parking", "solo", "open24", "broth", "meat", "rice", "old", "isnew"].filter((k) => S[k]).length;
    $("#fCount", app).textContent = active ? active : "";
    $("#filterBtn", app).classList.toggle("is-on", active > 0);
    $("#count", app).textContent = `${rs.length.toLocaleString()}곳` + (USE_REAL ? " · 출처 OpenStreetMap" : " · 예시 데이터");
    $("#bboxChip", app).innerHTML = bbox ? `<button class="chip is-on" id="clearBbox">지도 영역 필터 ${icon("x")}</button>` : "";
    $$("#regionChips .chip", app).forEach((c) => c.classList.toggle("is-on", c.dataset.region === S.region));
    renderBanners();
    map.setPins(rs.map((x) => x.r));

    if (!Store.restaurants().length) {
      listEl.innerHTML = UI.empty("등록된 식당이 없어요", "관리자 화면에서 식당을 등록하면 여기에 나타나요.");
      return;
    }
    if (!rs.length) {
      listEl.innerHTML = UI.empty("조건에 맞는 식당이 없어요", "필터를 줄이거나 다른 방법으로 찾아보세요.<br>예) 식당 이름 대신 지역 이름(서울, 부산) 또는 메뉴(우거지, 묵은지)로 검색",
        `<button class="btn btn--sm btn--lime" data-act="reset">필터 초기화</button><button class="btn btn--sm" data-act="all">전국 전체 보기</button>`);
      return;
    }
    const shown = rs.slice(0, limit);
    listEl.innerHTML = shown.map(({ r, st, d }) => `<article class="map-row card" data-rid="${r.id}" tabindex="0" role="link">
      ${thumbHTML(r)}
      <div class="map-row__b">
        <div class="row gap-s fw">${r.sample ? '<span class="tag tag--ghost">예시</span>' : ""}${!st.count ? '<span class="tag tag--ghost">후기 0</span>' : ""}${r.isNew ? '<span class="tag tag--lime">NEW</span>' : ""}${r.oldSchool ? '<span class="tag">노포</span>' : ""}${r.open24 ? '<span class="tag">24시</span>' : ""}</div>
        <h3>${esc(r.name)}</h3>
        <div class="row gap-s">${bonesHTML(st.overall, "sm")}<b class="mono">${fmt1(st.overall)}</b><span class="small muted">후기 ${st.count}${st.lowSample ? " · 표본 적음" : ""}</span></div>
        <div class="map-row__addr">${esc(r.address || r.region + " " + r.district)}${d !== null ? ` · <b>${d < 1 ? Math.round(d * 1000) + "m" : d.toFixed(1) + "km"}</b>` : ""}</div>
        <div class="row gap-s small">${icon("car")} ${triLabel(r.parking, "주차 가능", "주차 불가")} · ${icon("user")} ${triLabel(r.solo, "혼밥 OK", "혼밥 불편")}</div>
      </div></article>`).join("") + (rs.length > limit ? `<button class="btn btn--block" data-more>${icon("plus")} 더 보기 (${(rs.length - limit).toLocaleString()}곳 남음)</button>` : "");
  }

  function showPop(id) {
    const r = Store.restaurant(id);
    if (!r) return;
    const st = Store.stats(id);
    map.highlight(id);
    $$(".map-row", app).forEach((x) => x.classList.toggle("is-hl", x.dataset.rid === id));
    const row = $(`.map-row[data-rid="${id}"]`, app);
    if (row && view === "list" && window.innerWidth > 960) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    $("#pinPop", app).innerHTML = `<div class="pin-pop card">
      ${thumbHTML(r)}
      <div class="pin-pop__b"><span class="mono small muted">${esc(r.region)} · ${esc(r.district)}${r.sample ? " · 예시" : ""}</span>
        <h3>${esc(r.name)}</h3>
        <div class="row gap-s">${bonesHTML(st.overall, "sm")}<b class="mono">${fmt1(st.overall)}</b><span class="small muted">후기 ${st.count}</span></div>
        <span class="small">${esc(r.address || r.region + " " + r.district)}</span>
        <a class="btn btn--sm btn--lime mt-s" href="#/r/${r.id}">상세 보기 ${icon("arrow")}</a></div>
      <button class="pin-pop__x" aria-label="닫기">${icon("x")}</button></div>`;
    $(".pin-pop__x", app).onclick = () => { $("#pinPop", app).innerHTML = ""; map.highlight(null); };
  }

  /* 이벤트 */
  const update = () => { limit = PAGE; syncUrl(); render(); };
  $("#searchForm", app).onsubmit = (e) => { e.preventDefault(); S.q = $("#q", app).value; update(); };
  $("#q", app).addEventListener("search", () => { S.q = $("#q", app).value; update(); });
  $("#regionChips", app).onclick = (e) => {
    const c = e.target.closest("[data-region]");
    if (!c) return;
    S.region = c.dataset.region;
    bbox = null;
    if (S.region) map.fit(regionBox(S.region), true); else map.reset(true);
    $("#areaBtn", app).hidden = true;
    update();
  };
  $("#sort", app).onchange = (e) => {
    if (e.target.value === "dist" && !myLoc) { e.target.value = S.sort; locate(true); return; }
    S.sort = e.target.value; update();
  };
  $("#filterBtn", app).onclick = () => { $("#filterPanel", app).hidden = !$("#filterPanel", app).hidden; };
  $$("[data-f]", app).forEach((sel) => (sel.onchange = () => { S[sel.dataset.f] = sel.value; update(); }));
  const resetAll = () => {
    ["q", "region", "price", "parking", "solo", "open24", "broth", "meat", "rice", "old", "isnew", "preset"].forEach((k) => (S[k] = ""));
    S.sort = "rating"; bbox = null;
    $("#q", app).value = ""; $("#sort", app).value = "rating";
    $$("[data-f]", app).forEach((sel) => (sel.value = ""));
    map.reset(true);
    update();
  };
  $("#resetBtn", app).onclick = resetAll;
  app.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear-preset]")) { S.preset = ""; update(); }
    if (e.target.closest("[data-clear-review]")) { S.review = ""; update(); }
    if (e.target.closest("#clearBbox")) { bbox = null; update(); }
    if (e.target.closest("[data-more]")) { limit += PAGE; render(); }
    const act = e.target.closest("[data-act]");
    if (act) { if (act.dataset.act === "reset") resetAll(); else { S.region = ""; S.q = ""; bbox = null; $("#q", app).value = ""; map.reset(true); update(); } }
  });
  $("#areaBtn", app).onclick = () => {
    const b = map.bounds();
    bbox = b.full ? null : b;
    S.region = "";
    $("#areaBtn", app).hidden = true;
    update();
    UI.toast(bbox ? "현재 지도 영역의 식당만 보여줘요" : "전국 식당을 보여줘요");
  };
  bindRestaurantCards(listEl);
  listEl.addEventListener("mouseover", (e) => { const row = e.target.closest(".map-row"); if (row) map.highlight(row.dataset.rid); });

  $("#viewTabs", app).onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    view = b.dataset.v;
    page.dataset.view = view;
    $$("#viewTabs button", app).forEach((x) => x.classList.toggle("is-on", x === b));
  };

  function locate(thenSort) {
    if (!navigator.geolocation) { UI.toast("이 브라우저는 위치 기능을 지원하지 않아요", { type: "error" }); return; }
    UI.toast("위치 권한을 확인하고 있어요…");
    navigator.geolocation.getCurrentPosition((pos) => {
      myLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setMe(myLoc.lat, myLoc.lng);
      S.sort = "dist"; $("#sort", app).value = "dist";
      $("#locBtn", app).classList.add("is-on");
      update();
      UI.toast("내 위치에서 가까운 순으로 정렬했어요");
    }, () => {
      UI.toast("위치 권한이 없어 거리순 정렬을 할 수 없어요. 지역 선택으로 찾아보세요.", { type: "error" });
    }, { timeout: 8000 });
  }
  $("#locBtn", app).onclick = () => locate(true);

  /* 처음 한 번은 불러오는 중 표시 */
  listEl.innerHTML = UI.skeleton(4);
  const timer = setTimeout(() => { firstLoad = false; render(); }, 280);
  return () => { clearTimeout(timer); map.destroy(); };
}, { keepScroll: false });
