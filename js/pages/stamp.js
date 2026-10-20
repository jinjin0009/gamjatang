/* 감자탕 도장깨기 — 도장 지도 · 지역별 완료율 · 미션 */

function missionRow(m) {
  return `<div class="mission ${m.done ? "is-done" : ""}">
    <span class="mission__ico">${icon(m.done ? "check" : m.badge ? BADGES[m.badge].icon : "flag")}</span>
    <div style="min-width:0"><b>${esc(m.title)}</b><div class="small" style="opacity:.75">${esc(m.desc)}</div>
      <div class="bar ${m.done ? "" : "striped"}"><i style="--w:${m.pct}%"></i></div></div>
    <div class="mission__r">${m.cur}/${m.goal}<br>+${m.xp} XP${m.badge ? `<br><span style="opacity:.7">${esc(BADGES[m.badge].name)}</span>` : ""}</div>
  </div>`;
}

Router.add("/stamp", (app, _p, query) => {
  const me = Store.me();
  const all = Store.restaurants();
  const p = me ? Store.progress(me.id) : null;
  const statusOf = (rid) => { if (!p) return null; const v = p.visits.find((x) => x.rid === rid); return v ? v.status : null; };
  let mTab = query.m === "done" ? "done" : "doing";
  let region = "";
  let colLimit = 60;

  app.innerHTML = `<div class="wrap" style="padding:32px 24px 60px">
    <div class="sec__head"><div><div class="kicker">${icon("stamp")} STAMP TOUR</div><h1 class="h1 mt-s">전국 감자탕<br><span class="hl">도장깨기</span></h1></div>
      ${p ? `<div class="row gap fw">
        <div class="kpi"><span class="mono small">도장</span><b>${p.visits.length}<span style="font-size:.5em">/${all.length}</span></b></div>
        <div class="kpi" style="background:var(--ink);color:var(--lime)"><span class="mono small">인증 도장</span><b>${p.verified.length}</b></div>
        <div class="kpi" style="background:var(--lime)"><span class="mono small">지역</span><b>${p.regions.filter((r) => r.got).length}<span style="font-size:.5em">/${REGIONS.length}</span></b></div>
      </div>` : ""}
    </div>
    ${me ? "" : `<div class="invite mb">${icon("lock")}<div><b class="kr" style="font-size:22px">로그인하면 내 도장 지도가 시작돼요</b><p class="small mt-s">방문 기록과 인증 도장은 계정에 저장돼서 다른 기기에서도 이어서 모을 수 있어요. (지금은 시안 단계라 이 브라우저에만 저장)</p></div>
      <div class="row gap fw"><a class="btn btn--ink" href="#/login?mode=signup&next=%2Fstamp">회원가입</a><a class="btn" href="#/login?next=%2Fstamp">로그인</a></div></div>`}

    <div class="stamp-layout mt">
      <div>
        <div class="stamp-map" id="smap"></div>
        <div class="legend mt"><span><i style="background:var(--ink)"></i>인증 도장</span><span><i style="background:var(--lime);border-style:dashed"></i>방문 기록</span><span><i style="background:var(--yellow)"></i>인증 확인 중</span><span><i style="background:#CFC8B8"></i>미방문</span></div>
        <p class="small muted mt-s">핀을 누르면 식당 상세로 이동해요.</p>
      </div>
      <div>
        <h2 class="h3">${icon("map")} 지역별 완료율</h2>
        <div class="region-grid mt" id="regions">${(p ? p.regions : REGIONS.map((r) => ({ region: r, total: all.filter((x) => x.region === r).length, got: 0, pct: 0 }))).map((r) => `
          <button class="region-cell ${r.total && r.got === r.total ? "is-done" : ""}" data-region="${r.region}" style="text-align:left">
            <span class="row" style="justify-content:space-between"><b>${r.region}</b><span class="mono small">${r.got}/${r.total}</span></span>
            <div class="bar"><i style="--w:${r.pct}%"></i></div><span class="mono small">${r.pct}%</span></button>`).join("")}</div>

        <div class="row gap fw mt-l" style="justify-content:space-between"><h2 class="h3">${icon("flag")} 미션</h2>
          <div class="tabs" id="mTabs"><button data-t="doing">진행 중</button><button data-t="done">완료</button></div></div>
        <div class="mt" id="missions"></div>
      </div>
    </div>

    <div class="sec__head mt-l"><div><div class="kicker">${icon("grid")} COLLECTION</div><h2 class="h2 mt-s">도장 컬렉션</h2></div><div class="chips" id="colFilter"></div></div>
    <div class="stamp-grid" id="collection"></div>
  </div>`;

  const map = createMap($("#smap", app), {
    restaurants: all,
    pinClass: (r) => { const s = statusOf(r.id); return s === "verified" ? "is-verified" : s === "self" ? "is-self" : s === "pending" ? "is-pending" : "is-none"; },
    onPin: (id) => Router.go("/r/" + id),
  });

  const drawMissions = () => {
    $$("#mTabs button", app).forEach((b) => b.classList.toggle("is-on", b.dataset.t === mTab));
    const list = (p ? p.missions : MISSIONS.map((m) => {
      const goal = m.goal === "all" ? all.filter((r) => r.region === m.metric.split(":")[1]).length : m.goal;
      return { ...m, goal, cur: 0, pct: 0, done: false };
    })).filter((m) => (mTab === "done" ? m.done : !m.done));
    $("#missions", app).innerHTML = list.length ? list.map(missionRow).join("")
      : mTab === "done" ? UI.empty("아직 완료한 미션이 없어요", "첫 방문 기록으로 '첫 번째 감자탕집 방문'을 깨 보세요!", `<a class="btn btn--sm btn--lime" href="#/map">맛집 찾기</a>`)
        : UI.empty("모든 미션 완료!", "당신은 진정한 BONE MASTER.");
  };
  const drawCollection = () => {
    $("#colFilter", app).innerHTML = ["", ...REGIONS].map((r) => `<button class="chip ${region === r ? "is-on" : ""}" data-r="${r}">${r || "전체"}</button>`).join("");
    // 받은 도장이 먼저, 나머지는 60곳씩 더 보기
    const list = all.filter((r) => !region || r.region === region).sort((a, b) => (statusOf(b.id) ? 1 : 0) - (statusOf(a.id) ? 1 : 0));
    $("#collection", app).innerHTML = list.slice(0, colLimit).map((r) => {
      const s = statusOf(r.id);
      return `<a class="stamp-tile ${s ? "" : "is-none"}" href="#/r/${r.id}">${stampHTML(r, s === "rejected" ? null : s)}<b>${esc(r.name)}</b><span class="small muted">${esc(r.district || r.region)}</span></a>`;
    }).join("") + (list.length > colLimit ? `<button class="btn" data-more style="grid-column:1/-1">${icon("plus")} 더 보기 (${(list.length - colLimit).toLocaleString()}곳 남음)</button>` : "");
  };
  $("#mTabs", app).onclick = (e) => { const b = e.target.closest("button"); if (b) { mTab = b.dataset.t; drawMissions(); } };
  $("#colFilter", app).onclick = (e) => { const b = e.target.closest("[data-r]"); if (b) { region = b.dataset.r; colLimit = 60; drawCollection(); } };
  $("#collection", app).addEventListener("click", (e) => { if (e.target.closest("[data-more]")) { colLimit += 60; drawCollection(); } });
  $("#regions", app).onclick = (e) => {
    const b = e.target.closest("[data-region]");
    if (!b) return;
    map.fit(regionBox(b.dataset.region));
    region = b.dataset.region; drawCollection();
    if (window.innerWidth < 960) $("#smap", app).scrollIntoView({ behavior: "smooth", block: "center" });
  };
  drawMissions();
  drawCollection();
  return () => map.destroy();
});
